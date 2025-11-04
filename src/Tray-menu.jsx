import React, { useEffect, useState } from 'react';
import CircleTimer from './components/CircleTimer.jsx';

function TrayMenu() {
  const [duration, setDuration] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isOverLimit, setIsOverLimit] = useState(false);

  useEffect(() => {
    // initialize and subscribe to main timer
    if (window && window.electronAPI && window.electronAPI.getTimerState) {
      window.electronAPI.getTimerState().then(state => {
        setDuration(state.duration || 0);
        setTimeLeft(state.timeLeft || 0);
        setIsOverLimit(state.isOverLimit || false);
      }).catch(() => { });

      const off = window.electronAPI.onTimerUpdate((state) => {
        setDuration(state.duration || 0);
        setTimeLeft(state.timeLeft || 0);
        setIsOverLimit(state.isOverLimit || false);
      });
      return () => { try { off && off(); } catch (e) { } };
    }
  }, []);

  return (
    <div className="main-container">
      <div className="title">
        <p className="text">
          {isOverLimit ? "You've exceeded your gaming limit!" : "Your current gaming time limit"}
        </p>
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