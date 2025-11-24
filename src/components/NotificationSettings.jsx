import React, { useState, useEffect } from 'react';
import '../css/NotificationSettings.css';

function NotificationSettings() {
  const [preferences, setPreferences] = useState({
    newGameDetected: true,
    gameStarted: true,
    gameStopped: true
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
      setPreferences(prefs);
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
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      alert('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notification-settings">
      <h3>Notification Preferences</h3>
      <p className="description">Choose which notifications you want to receive</p>

      <div className="notification-options">
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

