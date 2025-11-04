import React from 'react';
import '/src/css/Checkbox.css';

function Checkbox({ label, isChecked, limitMinutes, onChange }) {
    const handleChange = () => {
        onChange(!isChecked);
    };

    // Format minutes as HH:MM
    const formatTime = (minutes) => {
        if (!minutes || minutes === 0) return '00:00';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    return (
        <label className="checkbox-container">
            <p>{label}</p>
            <p className='current-limit'>{formatTime(limitMinutes)}</p>
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