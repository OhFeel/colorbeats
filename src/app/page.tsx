'use client';

import { useEffect, useState } from 'react';
import { initiateLogin } from '@/lib/spotify';
import PlaylistGrid from '@/components/PlaylistGrid';
import Navbar from '@/components/Navbar';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogin = () => {
    initiateLogin();
  };

  useEffect(() => {
    // Only check for access token from redirect
    const params = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = params.get('access_token');

    if (sessionStorage.getItem('just_logged_out')) {
      sessionStorage.removeItem('just_logged_out');
      setIsAuthenticated(false);
    } else if (accessToken) {
      localStorage.setItem('spotify_access_token', accessToken);
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">
      <p className="text-lg">Loading...</p>
    </div>;
  }

  return (
    <>
      {isAuthenticated && <Navbar />}
      <main className={`min-h-screen ${isAuthenticated ? 'pt-20' : ''} p-8`}>
        {!isAuthenticated ? (
          <div className="flex min-h-[80vh] flex-col items-center justify-center">
            <h1 className="mb-8 text-7xl font-bold tracking-tight">
              Color<span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">Beats</span>
            </h1>
            <p className="mb-12 max-w-md text-center text-xl text-gray-600 dark:text-gray-400">
              Transform your Spotify playlists into a visual journey. Organize your music by the colors of album artwork.
            </p>
            <button
              onClick={handleLogin}
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-green-500 px-8 py-3 font-bold text-white transition-all hover:bg-green-600"
            >
              <span className="mr-2">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </span>
              Connect with Spotify
              <span className="absolute -right-2 -top-2 h-4 w-4 animate-ping rounded-full bg-green-400"></span>
            </button>
          </div>
        ) : (
          <PlaylistGrid />
        )}
      </main>
    </>
  );
}
