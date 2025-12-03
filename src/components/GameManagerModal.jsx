import React, { useState, useEffect } from 'react';
import '../css/GameManagerModal.css';

function GameManagerModal({ isOpen, onClose }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddGame, setShowAddGame] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGamePath, setNewGamePath] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadGames();
    }
  }, [isOpen]);

  const loadGames = async () => {
    try {
      setLoading(true);
      const allGames = await window.electronAPI.getAllGames();
      setGames(allGames);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (gameId, currentEnabled) => {
    try {
      if (currentEnabled) {
        await window.electronAPI.disableGame(gameId);
      } else {
        await window.electronAPI.enableGame(gameId);
      }
      await loadGames();
    } catch (error) {
      console.error('Error toggling game:', error);
    }
  };

  const handleDeleteGame = async (gameId, gameName) => {
    if (window.confirm(`Are you sure you want to delete "${gameName}"?`)) {
      try {
        await window.electronAPI.deleteGame(gameId);
        await loadGames();
      } catch (error) {
        console.error('Error deleting game:', error);
      }
    }
  };

  const handleBrowseFile = async () => {
    try {
      const result = await window.electronAPI.selectGameFile();
      if (!result.canceled && result.filePath) {
        setNewGamePath(result.filePath);
        
        // Extract game name from file path if name is empty
        if (!newGameName.trim()) {
          const fileName = result.filePath.split(/[\\\/]/).pop();
          const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
          setNewGameName(nameWithoutExt);
        }
      }
    } catch (error) {
      console.error('Error browsing for file:', error);
      alert('Failed to open file browser');
    }
  };

  const handleAddGame = async () => {
    if (!newGameName.trim() || !newGamePath.trim()) {
      alert('Please enter both game name and executable path');
      return;
    }

    try {
      await window.electronAPI.addManualGame(newGameName, newGamePath);
      setNewGameName('');
      setNewGamePath('');
      setShowAddGame(false);
      await loadGames();
    } catch (error) {
      console.error('Error adding game:', error);
      alert('Failed to add game. Please check the path and try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Games</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading games...</div>
          ) : (
            <>
              <div className="games-list">
                {games.length === 0 ? (
                  <div className="no-games">No games detected yet. Launch a game to detect it automatically!</div>
                ) : (
                  <table className="games-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Platform</th>
                        <th>Enabled</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {games.map((game) => (
                        <tr key={game.id} className={!game.enabled ? 'disabled-game' : ''}>
                          <td title={game.location}>{game.name}</td>
                          <td>{game.platform}</td>
                          <td>
                            <label className="toggle-switch">
                              <input
                                type="checkbox"
                                checked={game.enabled !== false}
                                onChange={() => handleToggleEnabled(game.id, game.enabled)}
                              />
                              <span className="toggle-slider"></span>
                            </label>
                          </td>
                          <td>
                            <button
                              className="delete-button"
                              onClick={() => handleDeleteGame(game.id, game.name)}
                              title="Delete game"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {!showAddGame ? (
                <button className="add-game-button" onClick={() => setShowAddGame(true)}>
                  + Add Game Manually
                </button>
              ) : (
                <div className="add-game-form">
                  <h3>Add Game Manually</h3>
                  <input
                    type="text"
                    placeholder="Game Name"
                    value={newGameName}
                    onChange={(e) => setNewGameName(e.target.value)}
                    className="game-input"
                  />
                  <div className="file-input-container">
                    <input
                      type="text"
                      placeholder="Executable Path (e.g., C:\Games\mygame.exe)"
                      value={newGamePath}
                      onChange={(e) => setNewGamePath(e.target.value)}
                      className="game-input file-path-input"
                      readOnly
                    />
                    <button 
                      type="button"
                      className="browse-button" 
                      onClick={handleBrowseFile}
                    >
                      Browse
                    </button>
                  </div>
                  <div className="form-buttons">
                    <button className="cancel-button" onClick={() => {
                      setShowAddGame(false);
                      setNewGameName('');
                      setNewGamePath('');
                    }}>
                      Cancel
                    </button>
                    <button className="submit-button" onClick={handleAddGame}>
                      Add Game
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default GameManagerModal;

