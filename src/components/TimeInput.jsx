import React, { useState } from 'react';
import '/src/css/TimeInput.css';

function TimeInput() {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  const handleHoursChange = (event) => {
    const value = event.target.value;
    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 23)) {
      setHours(value);
    }
  };

  const handleMinutesChange = (event) => {
    const value = event.target.value;
    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
      setMinutes(value);
    }
  };

  return (
    <div className="time-input-container">
      <label>
        <div className="input-with-unit">
          <input
            type="number"
            value={hours}
            onChange={handleHoursChange}
            min="0"
            max="23"
            placeholder="HH"
          />
          <span className="unit">h</span>
          <div className="spinner">
            <button type="button" className="spin up" onClick={() => setHours(prev => {
              const next = Math.min(24, (prev === '' ? 0 : Number(prev)) + 1);
              return String(next);
            })} aria-label="Increase hours">▲</button>
            <button type="button" className="spin down" onClick={() => setHours(prev => {
              const next = Math.max(0, (prev === '' ? 0 : Number(prev)) - 1);
              return String(next);
            })} aria-label="Decrease hours">▼</button>
          </div>
        </div>
      </label>
      <label>
        <div className="input-with-unit">
          <input
            type="number"
            value={minutes}
            onChange={handleMinutesChange}
            min="0"
            max="59"
            placeholder="MM"
          />
          <span className="unit">m</span>
          <div className="spinner">
            <button type="button" className="spin up" onClick={() => setMinutes(prev => {
              const next = Math.min(59, (prev === '' ? 0 : Number(prev)) + 1);
              return String(next);
            })} aria-label="Increase minutes">▲</button>
            <button type="button" className="spin down" onClick={() => setMinutes(prev => {
              const next = Math.max(0, (prev === '' ? 0 : Number(prev)) - 1);
              return String(next);
            })} aria-label="Decrease minutes">▼</button>
          </div>
        </div>
      </label>
      <p>Daily Limit</p>
      {/* <p>Selected Time: {hours.padStart(2, '0')}:{minutes.padStart(2, '0')}</p> */}
    </div>
  );
}

export default TimeInput;