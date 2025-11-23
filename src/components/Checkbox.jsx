import React from 'react';
import '/src/css/Checkbox.css';

function Checkbox({ label, isChecked, limitSeconds, onChange }) {
    const handleChange = () => {
        onChange(!isChecked);
    };

    // Format seconds as HH:MM
    const formatTime = (seconds) => {
        if (!seconds || seconds === 0) return '00:00';
        const totalMinutes = Math.floor(seconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    return (
        <label className="checkbox-container">
            <p className='day-label'>{label}</p>
            <p className='current-limit'>{formatTime(limitSeconds)}</p>
            <input
                type="checkbox"
                checked={isChecked}
                onChange={handleChange}
                className="visually-hidden"
            />
        </label>
    );
}

export default Checkbox;