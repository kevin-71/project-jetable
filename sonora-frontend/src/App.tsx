import { useEffect, useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { LibraryPage } from './pages/LibraryPage';
import { PlaylistPage } from './pages/PlaylistPage';
import { PlayerPage } from './pages/PlayerPage';
import { request } from './api/client';

interface User {
  id: string;
  email: string;
  displayName: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<'login' | 'library' | 'playlist' | 'player'>('login');
  const [currentTrack, setCurrentTrack] = useState<{ title: string; audioUrl: string } | null>(null);

  // Check URL for Google OAuth token and user info on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userStr = params.get('user');

    if (token && userStr) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', userStr);
      // Remove query params from browser address bar
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setActiveView('library');
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.clear();
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    localStorage.clear();
    setUser(null);
    setActiveView('login');
    setCurrentTrack(null);
  };

  const playTrack = (title: string, audioUrl: string) => {
    setCurrentTrack({ title, audioUrl });
    setActiveView('player');
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <p className="eyebrow">Sonora</p>
          <h1>Lecteur de Podcasts Techniques</h1>
          <p className="muted">Génération vocale intelligente.</p>
        </div>
        
        {user ? (
          <div className="user-profile">
            <span className="user-avatar">👤</span>
            <div className="user-details">
              <span className="user-name">{user.displayName}</span>
              <span className="user-email">{user.email}</span>
            </div>
          </div>
        ) : null}

        <nav className="nav">
          {!user ? (
            <button 
              type="button" 
              className={activeView === 'login' ? 'active' : ''} 
              onClick={() => setActiveView('login')}
            >
              Connexion
            </button>
          ) : (
            <>
              <button 
                type="button" 
                className={activeView === 'library' ? 'active' : ''} 
                onClick={() => setActiveView('library')}
              >
                Bibliothèque
              </button>
              <button 
                type="button" 
                className={activeView === 'playlist' ? 'active' : ''} 
                onClick={() => setActiveView('playlist')}
              >
                Playlists
              </button>
              <button 
                type="button" 
                className={activeView === 'player' ? 'active' : ''} 
                onClick={() => setActiveView('player')}
                disabled={!currentTrack}
              >
                Lecteur {currentTrack ? '▶️' : ''}
              </button>
              <button type="button" className="logout-btn" onClick={handleLogout}>
                Déconnexion
              </button>
            </>
          )}
        </nav>
        
        {currentTrack ? (
          <div className="now-playing-sidebar">
            <p className="eyebrow">En écoute</p>
            <div className="track-title">{currentTrack.title}</div>
          </div>
        ) : null}
      </aside>
      
      <main className="content">
        {activeView === 'login' && <LoginPage />}
        {activeView === 'library' && user && (
          <LibraryPage onPlayTrack={playTrack} />
        )}
        {activeView === 'playlist' && user && (
          <PlaylistPage onPlayTrack={playTrack} />
        )}
        {activeView === 'player' && user && (
          <PlayerPage audioUrl={currentTrack?.audioUrl} title={currentTrack?.title} />
        )}
      </main>
    </div>
  );
}
