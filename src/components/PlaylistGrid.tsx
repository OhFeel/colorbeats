import Image from 'next/image';
import { useState, useEffect } from 'react';
import { getAllUserPlaylists } from '@/lib/spotify';
import { sortByRainbow, type RGB } from '@/lib/colors';
import { extractDominantColor } from '@/lib/colorExtractor';
import type { SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import PlaylistModal from './PlaylistModal';

interface PlaylistWithColor extends SimplifiedPlaylist {
  dominantColor: RGB;
  imageUrl: string;
  firstTrackDate?: string;
}

export default function PlaylistGrid() {
  const [playlists, setPlaylists] = useState<PlaylistWithColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistWithColor | null>(null);
  const [sortBy, setSortBy] = useState<'color' | 'date' | 'tracks'>('date');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlaylists() {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching playlists...');
        const allPlaylists = await getAllUserPlaylists();
        console.log('Received playlists:', allPlaylists.length);
        
        // Filter out playlists without images first
        const playlistsWithImages = allPlaylists.filter(playlist => 
          playlist.images && playlist.images.length > 0 && playlist.images[0]?.url
        );
        
        const playlistsWithColors = await Promise.all(
          playlistsWithImages.map(async (playlist) => {
            try {
              const imageUrl = playlist.images[0].url;
              const color = await extractDominantColor(imageUrl);
              return { 
                ...playlist, 
                dominantColor: color,
                imageUrl 
              };
            } catch (error) {
              console.warn(`Failed to process playlist ${playlist.name}:`, error);
              return null;
            }
          })
        );

        const validPlaylists = playlistsWithColors.filter((p): p is PlaylistWithColor => p !== null);
        console.log('Valid playlists after color extraction:', validPlaylists.length);
        
        const sortedPlaylists = sortPlaylists(validPlaylists, sortBy);
        console.log('Setting playlists in state...');
        setPlaylists(sortedPlaylists);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching playlists:', error);
        setError('Failed to load playlists. Please try again.');
        setLoading(false);
      }
    }

    fetchPlaylists();
  }, [sortBy]);

  const sortPlaylists = (playlists: PlaylistWithColor[], sortMethod: string) => {
    switch (sortMethod) {
      case 'date':
        // Sort by added_at date of first track (newest first)
        return [...playlists].sort((a, b) => {
          const dateA = a.firstTrackDate ? new Date(a.firstTrackDate).getTime() : 0;
          const dateB = b.firstTrackDate ? new Date(b.firstTrackDate).getTime() : 0;
          return dateB - dateA;
        });
      case 'tracks':
        // Sort by number of tracks
        return [...playlists].sort((a, b) => (b.tracks?.total ?? 0) - (a.tracks?.total ?? 0));
      case 'color':
        // Sort by color using existing rainbow sort
        return sortByRainbow(playlists.map(p => p.dominantColor))
          .map(color => playlists.find(p => p.dominantColor.join(',') === color.join(',')))
          .filter((p): p is PlaylistWithColor => p !== undefined);
      default:
        return playlists;
    }
  };

  const handlePlaylistClick = (playlist: PlaylistWithColor) => {
    setSelectedPlaylist(playlist);
  };

  const handleCloseModal = () => {
    setSelectedPlaylist(null);
  };

  // Add loading state debug
  console.log('Current loading state:', loading);
  console.log('Current playlists count:', playlists.length);

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 dark:text-red-400">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Loading your playlists... Please wait.
          </p>
        </div>
      </div>
    );
  }

  // Add empty state handling
  if (!loading && playlists.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            No playlists found. Try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
        
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 dark:text-gray-400">Sort by:</label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'color' | 'date' | 'tracks')}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium shadow-sm 
              hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <option value="date">Newest Playlist</option>
            <option value="tracks">Most Tracks</option>
            
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="group relative cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
            style={{
              backgroundColor: `rgb(${playlist.dominantColor.join(',')})`
            }}
            onClick={() => handlePlaylistClick(playlist)}
          >
            <div className="relative aspect-square">
              <Image
                src={playlist.imageUrl}
                alt={playlist.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 transition-all duration-300 group-hover:opacity-100">
                <h3 className="font-bold">{playlist.name}</h3>
                <p className="text-sm text-gray-200">{playlist.tracks?.total ?? 0} tracks</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {selectedPlaylist && (
        <PlaylistModal playlist={selectedPlaylist} onClose={handleCloseModal} />
      )}
    </>
  );
}
