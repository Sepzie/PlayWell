import React, { useState } from 'react';
import '../css/Settings.css';
import GameManagerModal from '../components/GameManagerModal.jsx';
import NotificationSettings from '../components/NotificationSettings.jsx';

function Settings() {
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleExit = () => {
    window.electronAPI.exitApp();
  };

  const handleResetData = async () => {
    const confirmed = window.confirm(
      'This will delete all local data (games, sessions, limits, notifications). This cannot be undone. Continue?'
    );
    if (!confirmed) {
      return;
    }

    setIsResetting(true);
    setResetMessage('');

    try {
      const result = await window.electronAPI.resetAllData();
      if (result && result.ok) {
        setResetMessage('All data cleared. PlayWell is ready for a fresh start.');
      } else {
        setResetMessage('Unable to clear data. Please try again.');
      }
    } catch (error) {
      setResetMessage('Unable to clear data. Please try again.');
    } finally {
      setIsResetting(false);
    }
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

          {/* Data Reset Section */}
          <div className="settings-section data-reset">
            <div className="data-reset-content">
              <h2>Reset local data</h2>
              <p className="section-description">
                Clears your games, sessions, limits, and notification preferences on this device.
              </p>
              {resetMessage ? <p className="reset-status">{resetMessage}</p> : null}
            </div>
            <button
              className="reset-data-button"
              onClick={handleResetData}
              disabled={isResetting}
            >
              {isResetting ? 'Clearing...' : 'Delete All Data'}
            </button>
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
