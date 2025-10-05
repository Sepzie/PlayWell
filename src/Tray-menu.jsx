import React, { useState } from 'react';
import CircleTimer from './components/CircleTimer.jsx';

function TrayMenu() {
  const [resetKey, setResetKey] = useState(0);

  return (
    <div className="main-container">
        <div className="title">
            <p className="text">Your current gaming time limit</p>
        </div>
        
    <CircleTimer durationInSeconds={100} resetKey={resetKey} /> {/* Timer is hard coded as placeholder */}

    <div className="timer-button-container">
      <button className="timer-button" onClick={() => setResetKey(k => k + 1)}>Placeholder</button>
    </div>
        <footer>
        </footer>
    </div>
  );
}

export default TrayMenu;