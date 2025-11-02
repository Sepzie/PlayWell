import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import "/src/css/App.css"

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    if (window && window.electronAPI && window.electronAPI.onNavigate) {
      const off = window.electronAPI.onNavigate((route) => {
        try {
          // Normalize route and navigate using react-router
          const normalized = route && route.startsWith('/') ? route : `/${route}`;
          navigate(normalized);
        } catch (err) {
          console.error('Failed to navigate to route from main process:', err);
        }
      });

      return () => {
        try { off && off(); } catch (e) { /* ignore */ }
      };
    }
  }, [navigate]);
  return (
    <div className="app">
      <div id="nav">
        <Nav />
      </div>
      <div className="main-content">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default App;

