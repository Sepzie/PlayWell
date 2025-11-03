import React from 'react';
import '/src/css/CircleTimer.css';

// Display-only CircleTimer. Receives current duration and timeLeft from main process.
const CircleTimer = ({ durationInSeconds = 0, timeLeft = 0 }) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;

    // Guard against division by zero
    const progress = durationInSeconds > 0 ? (timeLeft / durationInSeconds) * circumference : 0;

    // Format time as HH:MM:SS
    const formatTime = (totalSeconds) => {
        const secs = Math.max(0, Math.floor(totalSeconds));
        const hours = Math.floor(secs / 3600);
        const minutes = Math.floor((secs % 3600) / 60);
        const seconds = secs % 60;
        const hh = String(hours).padStart(2, '0');
        const mm = String(minutes).padStart(2, '0');
        const ss = String(seconds).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    };

    return (
        <div className="circle-timer-container">
            <svg className="circle-timer-svg" viewBox="0 0 100 100">
                <circle
                    className="circle-timer-background"
                    cx="50"
                    cy="50"
                    r={radius}
                />
                <circle
                    className="circle-timer-progress"
                    cx="50"
                    cy="50"
                    r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                />
            </svg>
            <div className="circle-timer-text">{formatTime(timeLeft)}</div>
        </div>
    );
};

export default CircleTimer;