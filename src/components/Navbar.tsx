import { useEffect, useState } from 'react';
import { spotify, logout } from '@/lib/spotify';
import Image from 'next/image';

interface SpotifyUser {
  display_name: string;
  images?: { url: string }[];
}

export default function Navbar() {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [playlistCount, setPlaylistCount] = useState(0);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const [userData, playlistData] = await Promise.all([
          spotify.currentUser.profile(),
          spotify.currentUser.playlists.playlists()
        ]);
        setUser(userData);
        setPlaylistCount(playlistData.total);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    }
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      // Use replace instead of href to prevent history issues
      window.location.replace('/?logout=true');
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback
      window.location.replace('/?logout=true');
    }
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">
            Color<span className="text-green-500">Beats</span>
          </span>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                {user.images?.[0]?.url && (
                  <Image
                    src={user.images[0].url}
                    alt={user.display_name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <span className="font-medium">{user.display_name}</span>
              </div>
              <span className="text-xs text-gray-500">
                {playlistCount} playlist{playlistCount !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
