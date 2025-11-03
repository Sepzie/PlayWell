import React, { useState, useEffect } from 'react';
import "/src/css/Limits.css";
import CircleTimer from '/src/components/CircleTimer.jsx';
import Checkbox from '/src/components/Checkbox.jsx';
import TimeInput from '/src/components/TimeInput.jsx';

function Limits() {
  const [duration, setDuration] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    // initialize and subscribe to main timer
    if (window && window.electronAPI && window.electronAPI.getTimerState) {
      window.electronAPI.getTimerState().then(state => {
        setDuration(state.duration || 0);
        setTimeLeft(state.timeLeft || 0);
      }).catch(() => { });

      const off = window.electronAPI.onTimerUpdate((state) => {
        setDuration(state.duration || 0);
        setTimeLeft(state.timeLeft || 0);
      });
      return () => { try { off && off(); } catch (e) { } };
    }
  }, []);

  return (
    <div className="main-container">
      <div className="title">
        <h1>Daily Playtime Limits</h1>
      </div>
      <p className="text">Your current gaming time limit</p>
      <CircleTimer durationInSeconds={duration} timeLeft={timeLeft} />
      <TimeInput />
      <div className="limits-row">
        <Checkbox label="Sun" />
        <Checkbox label="Mon" />
        <Checkbox label="Tue" />
        <Checkbox label="Wed" />
        <Checkbox label="Thu" />
        <Checkbox label="Fri" />
        <Checkbox label="Sat" />
      </div>
      <div className="save-button-container">
        <button
          className="timer-button"
          onClick={() => {
            window.electronAPI.startTimer(100);
            /* Temporaray hard coded timer start */
          }}
        >Save</button>
      </div>
    </div>
  );
}

export default Limits;


