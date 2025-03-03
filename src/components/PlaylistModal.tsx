import { useState, useEffect } from 'react';
import { type SimplifiedPlaylist, type PlaylistedTrack } from '@spotify/web-api-ts-sdk';
import Image from 'next/image';
import { RGB, rgbToHsl, getColorCategory } from '@/lib/colors';
import { getPlaylistTracks, reorderPlaylist, checkPlaylistPermissions, savePlaylistBackup, hasPlaylistBackup, restorePlaylistFromBackup } from '@/lib/spotify';
import { extractDominantColor } from '@/lib/colorExtractor';
import { motion, AnimatePresence } from 'framer-motion';

interface PlaylistModalProps {
  playlist: SimplifiedPlaylist & { dominantColor: RGB };
  onClose: () => void;
}

interface TrackWithColor extends PlaylistedTrack {
  dominantColor: RGB;
}

export default function PlaylistModal({ playlist, onClose }: PlaylistModalProps) {
  const [tracks, setTracks] = useState<PlaylistedTrack[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [progress, setProgress] = useState('');
  const [canModify, setCanModify] = useState(false);
  const [timeEstimate, setTimeEstimate] = useState<number>(0);
  const [hasBackup, setHasBackup] = useState(false);

  useEffect(() => {
    async function fetchTracks() {
      const tracks = await getPlaylistTracks(playlist.id);
      setTracks(tracks);
    }
    fetchTracks();
  }, [playlist.id]);

  useEffect(() => {
    async function checkPermissions() {
      try {
        const hasPermission = await checkPlaylistPermissions(playlist.id);
        setCanModify(hasPermission);
      } catch {
        console.error('Failed to check permissions');
        setCanModify(false);
      }
    }
    checkPermissions();
  }, [playlist.id]);

  useEffect(() => {
    async function checkBackup() {
      setHasBackup(hasPlaylistBackup(playlist.id));
    }
    checkBackup();
  }, [playlist.id]);

  const openInSpotify = () => {
    window.open(playlist.external_urls.spotify, '_blank');
  };

  const calculateTimeEstimate = (trackCount: number) => {
    // Rough estimation: 1 second per track for color analysis + 2 seconds base time
    return Math.ceil(trackCount * 1 + 2);
  };

  const reorderByColor = async () => {
    try {
      setIsReordering(true);
      const estimate = calculateTimeEstimate(tracks.length);
      setTimeEstimate(estimate);
      setProgress(`Starting reorder process (estimated: ${estimate} seconds)`);

      // Backup current order
      savePlaylistBackup(playlist.id, tracks);

      setProgress('Fetching tracks...');
      
      const originalTracks = tracks.map((track, index) => ({
        ...track,
        originalIndex: index
      }));
      
      setProgress(`Analyzing ${tracks.length} track colors...`);
      const tracksWithColors = await Promise.all(
        originalTracks.map(async (item) => {
          if (!('album' in item.track)) return null;
         
            const color = await extractDominantColor(item.track.album.images[0].url);
            return { 
              ...item, 
              dominantColor: color,
              originalIndex: item.originalIndex 
            };
          
        })
      );

      setProgress('Sorting tracks...');
      const validTracks = tracksWithColors.filter((t): t is TrackWithColor & { originalIndex: number } => t !== null);
      
      // Sort tracks by color and maintain original position for same colors
      const sortedTracks = validTracks.sort((a, b) => {
        const [hA, sA, lA] = rgbToHsl(...(a.dominantColor ?? [0, 0, 0]));
        const [hB, sB, lB] = rgbToHsl(...(b.dominantColor ?? [0, 0, 0]));
        
        // Compare color categories
        const categoryDiff = getColorCategory(hA) - getColorCategory(hB);
        if (categoryDiff !== 0) return categoryDiff;
        
        // Compare saturation
        const saturationDiff = sB - sA;
        if (Math.abs(saturationDiff) > 10) return saturationDiff;
        
        // Compare lightness
        const lightnessDiff = lB - lA;
        if (Math.abs(lightnessDiff) > 10) return lightnessDiff;
        
        // If colors are very similar, maintain original order
        return a.originalIndex - b.originalIndex;
      });

      // Update UI with new order
      setTracks(sortedTracks);
      
      setProgress(`Reordering ${sortedTracks.length} tracks...`);
      await reorderPlaylist(playlist.id, sortedTracks);
      
      setProgress('✅ Playlist updated successfully!');
      setTimeout(() => {
        setProgress('');
        setIsReordering(false);
      }, 2000);
    } catch {
      
      setProgress('❌ Error reordering playlist. Please try again.');
      setTimeout(() => {
        setProgress('');
        setIsReordering(false);
      }, 3000);
    }
  };

  const handleCancel = async () => {
    if (!isReordering) return;
    
    try {
      setProgress('Cancelling and restoring original order...');
      await restorePlaylistFromBackup(playlist.id);
      setProgress('✅ Restored original order');
      setTimeout(() => {
        setProgress('');
        setIsReordering(false);
      }, 2000);
    } catch {
      setProgress('❌ Error restoring original order');
    }
  };

  const handleRecover = async () => {
    try {
      setProgress('Recovering previous playlist order...');
      const success = await restorePlaylistFromBackup(playlist.id);
      if (success) {
        setProgress('✅ Recovered previous order');
        // Refresh tracks
        const refreshedTracks = await getPlaylistTracks(playlist.id);
        setTracks(refreshedTracks);
      } else {
        setProgress('❌ No backup found');
      }
      setTimeout(() => setProgress(''), 2000);
    } catch {
      setProgress('❌ Error recovering playlist');
      setTimeout(() => setProgress(''), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative h-[80vh] w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
        <div className="flex gap-6">
          {playlist.images[0] && (
            <Image
              src={playlist.images[0].url}
              alt={playlist.name}
              width={192}
              height={192}
              className="rounded-lg object-cover"
            />
          )}
          <div className="flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold">{playlist.name}</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {playlist.description || 'No description'}
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                {playlist.tracks?.total ?? 0} tracks
              </p>
              {progress && (
                <div className="mt-2">
                  <p className="text-sm text-green-500">{progress}</p>
                  {isReordering && timeEstimate > 0 && (
                    <p className="text-xs text-gray-500">
                      This might take around {timeEstimate} seconds
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={openInSpotify}
                className="mt-4 flex items-center gap-2 rounded-full bg-green-500 px-6 py-2 font-semibold text-white hover:bg-green-600"
              >
                Open in Spotify
              </button>
              {canModify && (
                <>
                  {isReordering ? (
                    <button
                      onClick={handleCancel}
                      className="mt-4 flex items-center gap-2 rounded-full bg-red-500 px-6 py-2 font-semibold text-white hover:bg-red-600"
                    >
                      Cancel
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={reorderByColor}
                        className="mt-4 flex items-center gap-2 rounded-full bg-blue-500 px-6 py-2 font-semibold text-white hover:bg-blue-600"
                      >
                        Sort by Colors
                      </button>
                      {hasBackup && (
                        <button
                          onClick={handleRecover}
                          className="mt-4 flex items-center gap-2 rounded-full bg-gray-500 px-6 py-2 font-semibold text-white hover:bg-gray-600"
                        >
                          Recover Previous
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 h-[calc(100%-200px)] overflow-y-auto">
          <AnimatePresence>
            {tracks.map((track, index) => (
              <motion.div
                key={`${track.track.uri}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-center gap-4 border-b border-gray-200 p-4 dark:border-gray-700"
              >
                {'album' in track.track && (
                  <Image
                    src={track.track.album.images[0]?.url}
                    alt={track.track.name}
                    width={48}
                    height={48}
                    className="rounded-md"
                  />
                )}
                <div>
                  <h3 className="font-medium">{track.track.name}</h3>
                  <p className="text-sm text-gray-500">
                    {('artists' in track.track) && 
                      track.track.artists.map(a => a.name).join(', ')}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
