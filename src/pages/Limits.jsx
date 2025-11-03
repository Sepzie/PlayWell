import React from 'react';
import "/src/css/Limits.css";
import CircleTimer from '/src/components/CircleTimer.jsx';
import TimeInput from '/src/components/TimeInput.jsx';
import Checkbox from '/src/components/Checkbox.jsx';

function Limits() {
  return (
    <div className="main-container">
      <div className="title">
        <h1>Daily Playtime Limits</h1>
      </div>
      <p className="text">Your current gaming time limit</p>
      <CircleTimer durationInSeconds={100} />
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
            window.electronAPI.openLimits();
          }}
        >Save</button>
      </div>
    </div>
  );
}

export default Limits;


