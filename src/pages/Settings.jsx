import React, { useState } from 'react';
import '../css/Settings.css';
import GameManagerModal from '../components/GameManagerModal.jsx';
import NotificationSettings from '../components/NotificationSettings.jsx';

function Settings() {
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);

  const handleExit = () => {
    window.electronAPI.exitApp();
  };

  return (
    <div className="page settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p className="subtitle">Configure your PlayWell preferences</p>
      </div>

      <div className="settings-content">
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

        {/* Exit Button */}
        <div className="exit-button-container">
          <button className="exit-button" onClick={handleExit}>
            Exit App
          </button>
        </div>
      </div>

      {/* Game Manager Modal */}
      <GameManagerModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
      />
    </div>
  );
}

export default Settings;
