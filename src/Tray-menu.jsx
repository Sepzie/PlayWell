import React, { useEffect, useState } from 'react';
import CircleTimer from './components/CircleTimer.jsx';

function TrayMenu() {
  const [duration, setDuration] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isOverLimit, setIsOverLimit] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

  useEffect(() => {
    let offTimer = null;
    let offPlaying = null;

    // initialize and subscribe to main timer
    if (window && window.electronAPI && window.electronAPI.getTimerState) {
      window.electronAPI.getTimerState().then(state => {
        setDuration(state.duration || 0);
        setTimeLeft(state.timeLeft || 0);
        setIsOverLimit(state.isOverLimit || false);
      }).catch(() => { });

      offTimer = window.electronAPI.onTimerUpdate((state) => {
        setDuration(state.duration || 0);
        setTimeLeft(state.timeLeft || 0);
        setIsOverLimit(state.isOverLimit || false);
      });
    }

    // Listen for currently playing game updates
    if (window && window.electronAPI && window.electronAPI.onCurrentlyPlayingChanged) {
      offPlaying = window.electronAPI.onCurrentlyPlayingChanged((game) => {
        setCurrentlyPlaying(game);
      });
    }

    // Return cleanup function that calls both
    return () => {
      try { offTimer && offTimer(); } catch (e) { }
      try { offPlaying && offPlaying(); } catch (e) { }
    };
  }, []);

  return (
    <div className="main-container">
      <div className="title">
        {currentlyPlaying ? (
          <p className="text currently-playing">
            🎮 Playing: {currentlyPlaying}
          </p>
        ) : (
          <p className="text">
            {isOverLimit ? "You've exceeded your gaming limit!" : "Your current gaming time limit"}
          </p>
        )}
      </div>

      <CircleTimer durationInSeconds={duration} timeLeft={timeLeft} />
      <div className="timer-button-container">
        <button
          className="timer-button"
          onClick={() => { if (window && window.electronAPI && window.electronAPI.openLimits) window.electronAPI.openLimits(); }}
        >Open Limits</button>
      </div>
      <footer>
      </footer>
    </div>
  );
}

export default TrayMenu;