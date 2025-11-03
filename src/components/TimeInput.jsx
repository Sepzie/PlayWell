import React, { useState } from 'react';
import '/src/css/TimeInput.css';

function TimeInput({ hours: propHours = 0, minutes: propMinutes = 0, onChange }) {
  const [hours, setHours] = useState(Number(propHours) || 0);
  const [minutes, setMinutes] = useState(Number(propMinutes) || 0);

  // Sync props -> local state
  React.useEffect(() => {
    if (typeof propHours !== 'undefined') setHours(Number(propHours) || 0);
  }, [propHours]);
  React.useEffect(() => {
    if (typeof propMinutes !== 'undefined') setMinutes(Number(propMinutes) || 0);
  }, [propMinutes]);

  const handleHoursChange = (event) => {
    let value = event.target.value;
    if (value === '') value = 0;
    let num = parseInt(value) || 0;
    num = Math.max(0, Math.min(23, num));
    setHours(num);
    onChange && onChange({ hours: num, minutes });
  };

  const handleMinutesChange = (event) => {
    let value = event.target.value;
    if (value === '') value = 0;
    let num = parseInt(value) || 0;
    num = Math.max(0, Math.min(59, num));
    setMinutes(num);
    onChange && onChange({ hours, minutes: num });
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
            placeholder="0"
          />
          <span className="unit">h</span>
          <div className="spinner">
            <button type="button" className="spin up" onClick={() => {
              const next = Math.min(23, Number(hours) + 1);
              setHours(next);
              onChange && onChange({ hours: next, minutes });
            }} aria-label="Increase hours">▲</button>
            <button type="button" className="spin down" onClick={() => {
              const next = Math.max(0, Number(hours) - 1);
              setHours(next);
              onChange && onChange({ hours: next, minutes });
            }} aria-label="Decrease hours">▼</button>
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
            placeholder="0"
          />
          <span className="unit">m</span>
          <div className="spinner">
            <button type="button" className="spin up" onClick={() => {
              const next = Math.min(59, Number(minutes) + 1);
              setMinutes(next);
              onChange && onChange({ hours, minutes: next });
            }} aria-label="Increase minutes">▲</button>
            <button type="button" className="spin down" onClick={() => {
              const next = Math.max(0, Number(minutes) - 1);
              setMinutes(next);
              onChange && onChange({ hours, minutes: next });
            }} aria-label="Decrease minutes">▼</button>
          </div>
        </div>
      </label>
      <p>Daily Limit</p>
    </div>
  );
}

export default TimeInput;