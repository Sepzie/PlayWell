import React, { useState, useEffect } from 'react';
import '../css/NotificationSettings.css';

function NotificationSettings() {
  const [preferences, setPreferences] = useState({
    newGameDetected: true,
    gameStarted: true,
    gameStopped: true,
    stopTrackingOnUnfocus: false
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await window.electronAPI.getNotificationPreferences();
      // Ensure all fields are present with defaults if missing
      setPreferences({
        newGameDetected: prefs.newGameDetected !== undefined ? prefs.newGameDetected : true,
        gameStarted: prefs.gameStarted !== undefined ? prefs.gameStarted : true,
        gameStopped: prefs.gameStopped !== undefined ? prefs.gameStopped : true,
        stopTrackingOnUnfocus: prefs.stopTrackingOnUnfocus !== undefined ? prefs.stopTrackingOnUnfocus : false
      });
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await window.electronAPI.updateNotificationPreferences(preferences);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // Reload preferences to ensure sync
      await loadPreferences();
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      alert('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notification-settings">
      <h3>Preferences</h3>
      <p className="description">Configure notifications and tracking behavior</p>

      <div className="notification-options">
        <h4 className="section-title">Notifications</h4>
        <div className="notification-option">
          <label>
            <input
              type="checkbox"
              checked={preferences.newGameDetected}
              onChange={() => handleToggle('newGameDetected')}
              disabled={loading}
            />
            <span className="option-label">
              <strong>New Game Detected</strong>
              <small>Notify when a new game is automatically detected</small>
            </span>
          </label>
        </div>

        <div className="notification-option">
          <label>
            <input
              type="checkbox"
              checked={preferences.gameStarted}
              onChange={() => handleToggle('gameStarted')}
              disabled={loading}
            />
            <span className="option-label">
              <strong>Game Started</strong>
              <small>Notify when you start playing a game</small>
            </span>
          </label>
        </div>

        <div className="notification-option">
          <label>
            <input
              type="checkbox"
              checked={preferences.gameStopped}
              onChange={() => handleToggle('gameStopped')}
              disabled={loading}
            />
            <span className="option-label">
              <strong>Game Stopped</strong>
              <small>Notify when you stop playing a game</small>
            </span>
          </label>
        </div>

        <h4 className="section-title">Tracking Behavior</h4>
        <div className="notification-option">
          <label>
            <input
              type="checkbox"
              checked={preferences.stopTrackingOnUnfocus}
              onChange={() => handleToggle('stopTrackingOnUnfocus')}
              disabled={loading}
            />
            <span className="option-label">
              <strong>Stop Tracking When Game Loses Focus</strong>
              <small>End gaming session after 30 seconds of the game window being inactive</small>
            </span>
          </label>
        </div>
      </div>

      <button
        className={`save-button ${saved ? 'saved' : ''}`}
        onClick={handleSave}
        disabled={loading}
      >
        {saved ? '✓ Saved' : 'Save Preferences'}
      </button>
    </div>
  );
}

export default NotificationSettings;

