import React, { useState } from 'react';
import '../css/Settings.css';
import GameManagerModal from '../components/GameManagerModal.jsx';
import NotificationSettings from '../components/NotificationSettings.jsx';
import "/src/css/Settings.css";

function Settings() {
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);

  const handleExit = () => {
    window.electronAPI.exitApp();
  };

  return (
    <div className="page settings-page">
      <h1>Settings</h1>
      <p className="subtitle">Configure your PlayWell preferences</p>

      <div className="settings-sections">
        {/* Game Management Section */}
        <div className="settings-section game-management">
          <div className="game-management-content">
            <h2>Game Management</h2>
            <p className="section-description">
              Manage which games are tracked. PlayWell automatically detects games, but you can also add them manually.
            </p>
          </div>
          <button
            className="manage-games-button"
            onClick={() => setIsGameModalOpen(true)}
          >
            Manage Games
          </button>
        </div>

        {/* Notifications Section */}
        <div className="settings-section">
          <NotificationSettings />
        </div>
      </div>

      {/* Game Manager Modal */}
      <GameManagerModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
      />

      <div className='centered-h'>
        <button className='exit-button' onClick={handleExit}>Exit App</button>
      </div>

    </div>

  );
}

export default Settings;
