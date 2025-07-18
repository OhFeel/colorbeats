import { SpotifyApi, PlaylistedTrack, SimplifiedPlaylist, Track } from '@spotify/web-api-ts-sdk';

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '';
const REDIRECT_URI = 'https://colorbeats.matsdh.nl';

const SCOPES = [
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-library-read'
];

export const spotify = SpotifyApi.withImplicitGrant(
  CLIENT_ID,
  REDIRECT_URI,
  SCOPES
);

// Add rate limiting utilities
const RATE_LIMIT_WINDOW = 2000; // 2 second window
const MAX_REQUESTS_PER_WINDOW = 3; // Maximum requests per 2 seconds
const requestTimestamps: number[] = [];

const PLAYLIST_BACKUP_PREFIX = 'playlist_backup_';

// Add new functions for backup management
export function savePlaylistBackup(playlistId: string, tracks: PlaylistedTrack[]) {
  localStorage.setItem(
    `${PLAYLIST_BACKUP_PREFIX}${playlistId}`, 
    JSON.stringify(tracks.map(t => t.track.uri))
  );
}

export function getPlaylistBackup(playlistId: string): string[] | null {
  const backup = localStorage.getItem(`${PLAYLIST_BACKUP_PREFIX}${playlistId}`);
  return backup ? JSON.parse(backup) : null;
}

export function hasPlaylistBackup(playlistId: string): boolean {
  return localStorage.getItem(`${PLAYLIST_BACKUP_PREFIX}${playlistId}`) !== null;
}

export async function restorePlaylistFromBackup(playlistId: string): Promise<boolean> {
  const backup = getPlaylistBackup(playlistId);
  if (!backup) return false;

  try {
    await spotify.playlists.updatePlaylistItems(playlistId, { uris: backup });
    return true;
  } catch (error) {
    console.error('Error restoring playlist:', error);
    return false;
  }
}

interface SpotifyErrorResponse {
  status?: number;
  headers?: Record<string, string>;
}

// Add type for queue items
type QueuedRequest = () => Promise<unknown>;

// Request queue implementation
class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private lastRequest = 0;
  private readonly minDelay = 50; // Minimum 50ms between requests

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          // Ensure minimum delay between requests
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequest;
          if (timeSinceLastRequest < this.minDelay) {
            await new Promise(r => setTimeout(r, this.minDelay - timeSinceLastRequest));
          }

          const result = await request();
          this.lastRequest = Date.now();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Queue processing error:', error);
        }
      }
      // Add small delay between requests
      await new Promise(r => setTimeout(r, this.minDelay));
    }

    this.processing = false;
  }
}

const requestQueue = new RequestQueue();

async function rateLimitedRequest<T>(request: () => Promise<T>): Promise<T> {
  return requestQueue.add(async () => {
    // Clean up old timestamps
    const now = Date.now();
    while (requestTimestamps.length > 0 && 
           requestTimestamps[0] < now - RATE_LIMIT_WINDOW) {
      requestTimestamps.shift();
    }

    // If we've hit the rate limit, wait
    if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      const delay = RATE_LIMIT_WINDOW - (now - requestTimestamps[0]);
      await new Promise(resolve => setTimeout(resolve, delay));
      return rateLimitedRequest(request);
    }

    try {
      const result = await request();
      requestTimestamps.push(Date.now());
      return result;
    } catch (error: unknown) {
      const spotifyError = error as SpotifyErrorResponse;
      if (spotifyError?.status === 429) {
        const retryAfter = parseInt(spotifyError.headers?.['retry-after'] || '2');
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return rateLimitedRequest(request);
      }
      throw error;
    }
  });
}

export function initiateLogin(): void {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(' '))}&response_type=token`;
  window.location.href = authUrl;
}

export async function logout() {
  // Clear all Spotify-related data
  localStorage.removeItem('spotify_access_token');
  sessionStorage.removeItem('spotify_access_token');
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('spotify:')) {
      localStorage.removeItem(key);
    }
  });

  // Add a flag to indicate logout state
  sessionStorage.setItem('just_logged_out', 'true');
  
  // Clear the Spotify client state
  await spotify.authenticate();
}

export async function getPlaylistTracks(playlistId: string): Promise<PlaylistedTrack[]> {
  const allTracks = [];
  let offset = 0;
  
  while (true) {
    const response = await spotify.playlists.getPlaylistItems(playlistId, undefined, undefined, 50, offset);
    allTracks.push(...response.items);
    
    if (response.items.length < 50 || offset >= response.total) {
      break;
    }
    
    offset += 50;
  }

  return allTracks.filter((item: PlaylistedTrack) => 
    item.track && 
    'album' in item.track && 
    (item.track as Track).album?.images?.[0]?.url
  );
}

const SPOTIFY_CHUNK_LIMIT = 100; // Spotify's limit for playlist track updates

export async function reorderPlaylist(playlistId: string, tracks: PlaylistedTrack[]) {
  try {
    // Split tracks into chunks of SPOTIFY_CHUNK_LIMIT
    const chunks = [];
    for (let i = 0; i < tracks.length; i += SPOTIFY_CHUNK_LIMIT) {
      chunks.push(tracks.slice(i, i + SPOTIFY_CHUNK_LIMIT));
    }

    // Process chunks sequentially
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const uris = chunk.map(track => track.track.uri);
      
      // Calculate the offset for this chunk
      const offset = i * SPOTIFY_CHUNK_LIMIT;
      
      // Use replace items endpoint for first chunk, add items for subsequent chunks
      if (i === 0) {
        await spotify.playlists.updatePlaylistItems(playlistId, { uris });
      } else {
        // For subsequent chunks, add them at the correct position
        await spotify.playlists.addItemsToPlaylist(playlistId, uris, offset);
      }

      // Add a small delay between chunks to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error reordering playlist:', error);
    throw error;
  }
}

export async function getAllUserPlaylists(): Promise<SimplifiedPlaylist[]> {
  try {
    const allPlaylists: SimplifiedPlaylist[] = [];
    let offset = 0;
    const limit = 50;
    let total = 0;

    do {
      const response = await rateLimitedRequest(() => 
        spotify.currentUser.playlists.playlists(limit, offset)
      );
      
      if (!response) break;
      
      total = response.total;
      allPlaylists.push(...response.items);
      offset += limit;

      // Add small delay between requests
      await new Promise(r => setTimeout(r, 100));
    } while (offset < total);

    console.log(`Fetched ${allPlaylists.length} playlists successfully`);
    return allPlaylists;
  } catch (error) {
    console.error('Error fetching playlists:', error);
    throw error;
  }
}

// Update checkPlaylistPermissions function for better type safety
export async function checkPlaylistPermissions(playlistId: string): Promise<boolean> {
  try {
    const [currentUser, playlist] = await Promise.all([
      spotify.currentUser.profile(),
      spotify.playlists.getPlaylist(playlistId)
    ]);
    
    return Boolean(
      playlist && (
        playlist.owner.id === currentUser.id ||
        playlist.collaborative ||
        !playlist.public
      )
    );
  } catch {
    return false;
  }
}
