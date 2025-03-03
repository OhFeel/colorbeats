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
const RATE_LIMIT_WINDOW = 1000; // 1 second window
const MAX_REQUESTS_PER_WINDOW = 5; // Maximum requests per second
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

async function rateLimitedRequest<T>(request: () => Promise<T>): Promise<T> {
  // Clean up old timestamps
  const now = Date.now();
  while (
    requestTimestamps.length > 0 && 
    requestTimestamps[0] < now - RATE_LIMIT_WINDOW
  ) {
    requestTimestamps.shift();
  }

  // If we've hit the rate limit, wait until the next window
  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestRequest = requestTimestamps[0];
    const waitTime = RATE_LIMIT_WINDOW - (now - oldestRequest);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  // Add current request timestamp
  requestTimestamps.push(now);

  try {
    return await request();
  } catch (error: unknown) {
    const spotifyError = error as SpotifyErrorResponse;
    if (spotifyError?.status === 429) { // Rate limit exceeded
      const retryAfter = parseInt(spotifyError.headers?.['retry-after'] || '1');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return rateLimitedRequest(request);
    }
    throw error;
  }
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

export async function reorderPlaylist(playlistId: string, tracks: PlaylistedTrack[]) {
  try {
    // Update playlist with new track order
    await spotify.playlists.updatePlaylistItems(playlistId, {
      uris: tracks.map(track => track.track.uri)
    });
    return true;
  } catch (error) {
    console.error('Error reordering playlist:', error);
    throw error;
  }
}

export async function getAllUserPlaylists(): Promise<SimplifiedPlaylist[]> {
  try {
    const allPlaylists = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    // Get current user for checking ownership
    const currentUser = await rateLimitedRequest(() => spotify.currentUser.profile());

    while (hasMore) {
      // Get both user's playlists and followed playlists
      const [ownedResponse, followedResponse] = await Promise.all([
        rateLimitedRequest(() => spotify.currentUser.playlists.playlists(50, offset)),
        rateLimitedRequest(() => spotify.playlists.getUsersPlaylists(currentUser.id, 50, offset))
      ]);

      // Get first track's added_at date for each playlist
      const playlistsWithDates = await Promise.all(
        [...ownedResponse.items, ...followedResponse.items].map(async (playlist) => {
          try {
            const tracks = await rateLimitedRequest(() => 
              spotify.playlists.getPlaylistItems(
                playlist.id,
                undefined,      // optional market parameter
                'items.added_at', // fields parameter
                1,              // limit parameter
                0               // offset parameter
              )
            );
            
            return {
              ...playlist,
              firstTrackDate: tracks.items[0]?.added_at
            };
          } catch (error) {
            console.warn(`Failed to get date for playlist ${playlist.name}:`, error);
            return playlist;
          }
        })
      );

      // Combine results
      allPlaylists.push(...playlistsWithDates);

      // Check if we need to fetch more
      hasMore = ownedResponse.next !== null || followedResponse.next !== null;
      offset += limit;
    }

    // Remove duplicates using Set
    const uniquePlaylists = Array.from(
      new Map(allPlaylists.map(p => [p.id, p])).values()
    );

    return uniquePlaylists.filter(playlist => 
      playlist.images?.length > 0 && // Has images
      playlist.tracks?.total && playlist.tracks.total > 0 && // Has tracks
      ( // User has write access
        playlist.owner.id === currentUser.id ||
        playlist.collaborative ||
        !playlist.public
      )
    );
  } catch (error: unknown) {
    console.error('Error fetching playlists:', error);
    return [];
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
