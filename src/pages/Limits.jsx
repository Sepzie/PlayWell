import React, { useState, useEffect } from 'react';
import "/src/css/Limits.css";
import CircleTimer from '/src/components/CircleTimer.jsx';
import Checkbox from '/src/components/Checkbox.jsx';
import TimeInput from '/src/components/TimeInput.jsx';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_TYPES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function Limits() {
  const [duration, setDuration] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [tempHours, setTempHours] = useState(0);
  const [tempMinutes, setTempMinutes] = useState(0);

  // Track which days are checked and their current limits (in seconds)
  const [dayLimits, setDayLimits] = useState({
    SUNDAY: { checked: false, limitSeconds: 0 },
    MONDAY: { checked: false, limitSeconds: 0 },
    TUESDAY: { checked: false, limitSeconds: 0 },
    WEDNESDAY: { checked: false, limitSeconds: 0 },
    THURSDAY: { checked: false, limitSeconds: 0 },
    FRIDAY: { checked: false, limitSeconds: 0 },
    SATURDAY: { checked: false, limitSeconds: 0 }
  });

  const [isSaving, setIsSaving] = useState(false);

  // Load existing limits on mount
  useEffect(() => {
    loadLimits();
  }, []);

  const loadLimits = async () => {
    try {
      const limits = await window.electronAPI.getLimits();
      const newDayLimits = { ...dayLimits };

      limits.forEach(limit => {
        if (newDayLimits[limit.type]) {
          newDayLimits[limit.type] = {
            checked: true,
            limitSeconds: limit.limitSeconds  // Now in seconds from backend
          };
        }
      });

      setDayLimits(newDayLimits);
    } catch (error) {
      console.error('Error loading limits:', error);
    }
  };

  // Subscribe to timer updates
  useEffect(() => {
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

  const handleDayCheckChange = (dayType, checked) => {
    setDayLimits(prev => ({
      ...prev,
      [dayType]: {
        ...prev[dayType],
        checked
      }
    }));
  };

  const handleApply = async () => {
    try {
      setIsSaving(true);
      const limitSeconds = (tempHours * 3600) + (tempMinutes * 60);  // Convert to seconds

      // Validate that at least one day is checked
      const anyChecked = Object.values(dayLimits).some(day => day.checked);
      if (!anyChecked) {
        alert('Please select at least one day to set a limit');
        setIsSaving(false);
        return;
      }

      // Validate that limit is greater than 0
      if (limitSeconds <= 0) {
        alert('Please set a limit greater than 0');
        setIsSaving(false);
        return;
      }

      // Save/delete limits for each day
      const promises = DAY_TYPES.map(async (dayType) => {
        if (dayLimits[dayType].checked) {
          // Set limit for checked days (in seconds)
          return window.electronAPI.setLimit(dayType, limitSeconds);
        } else {
          // Delete limit for unchecked days
          return window.electronAPI.deleteLimit(dayType);
        }
      });

      await Promise.all(promises);

      // Reload limits to update UI with the newly saved values
      await loadLimits();

      // Force timer to update immediately with new limits
      if (window.electronAPI && window.electronAPI.forceTimerUpdate) {
        window.electronAPI.forceTimerUpdate();
      }

      console.log('Limits saved successfully');
    } catch (error) {
      console.error('Error saving limits:', error);
      alert('Failed to save limits. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="main-container">
      <div className="title">
        <h1>Daily Playtime Limits</h1>
      </div>
      <p className="text">Your current gaming time limit</p>
      <CircleTimer durationInSeconds={duration} timeLeft={timeLeft} />
      <TimeInput
        hours={tempHours}
        minutes={tempMinutes}
        onChange={({hours, minutes}) => {
          setTempHours(hours);
          setTempMinutes(minutes);
        }}
      />
      <div className="limits-row">
        {DAY_TYPES.map((dayType, index) => (
          <Checkbox
            key={dayType}
            label={DAY_LABELS[index]}
            isChecked={dayLimits[dayType].checked}
            limitSeconds={dayLimits[dayType].limitSeconds}  // Pass seconds
            onChange={(checked) => handleDayCheckChange(dayType, checked)}
          />
        ))}
      </div>
      <div className="save-button-container">
        <button
          className="timer-button"
          onClick={handleApply}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Apply'}
        </button>
      </div>
    </div>
  );
}

export default Limits;


