import React, { useState } from 'react';
import '/src/css/Checkbox.css';

function Checkbox({ label }) {
    const [isChecked, setIsChecked] = useState(false);

    const handleChange = () => {
        setIsChecked(!isChecked);
    };

    return (
        <label className="checkbox-container">
            <p>{label}</p>
            <p className='current-limit'>00:00</p>
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