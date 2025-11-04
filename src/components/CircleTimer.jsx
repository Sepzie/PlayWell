import React from 'react';
import '/src/css/CircleTimer.css';

// Display-only CircleTimer. Receives current duration and timeLeft from main process.
const CircleTimer = ({ durationInSeconds = 0, timeLeft = 0 }) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;

    // Check if over limit (time is negative)
    const isOverLimit = timeLeft < 0;

    // Guard against division by zero
    // When over limit, show full red circle (progress = 0)
    const progress = isOverLimit
        ? 0
        : durationInSeconds > 0
            ? (timeLeft / durationInSeconds) * circumference
            : 0;

    // Format time as HH:MM:SS
    const formatTime = (totalSeconds) => {
        // Use absolute value for display when negative
        const secs = Math.floor(Math.abs(totalSeconds));
        const hours = Math.floor(secs / 3600);
        const minutes = Math.floor((secs % 3600) / 60);
        const seconds = secs % 60;
        const hh = String(hours).padStart(2, '0');
        const mm = String(minutes).padStart(2, '0');
        const ss = String(seconds).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    };

    return (
        <div className={`circle-timer-container ${isOverLimit ? 'over-limit' : ''}`}>
            <svg className="circle-timer-svg" viewBox="0 0 100 100">
                <circle
                    className="circle-timer-background"
                    cx="50"
                    cy="50"
                    r={radius}
                />
                <circle
                    className={`circle-timer-progress ${isOverLimit ? 'over-limit' : ''}`}
                    cx="50"
                    cy="50"
                    r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                />
            </svg>
            <div className={`circle-timer-text ${isOverLimit ? 'over-limit' : ''}`}>
                {isOverLimit && '-'}
                {formatTime(timeLeft)}
            </div>
            {isOverLimit && <div className="over-limit-warning">OVER LIMIT!</div>}
        </div>
    );
};

export default CircleTimer;