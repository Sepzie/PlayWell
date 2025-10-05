import React, { useState, useEffect } from 'react';

const CircleTimer = ({ durationInSeconds, resetKey }) => {
    const [timeLeft, setTimeLeft] = useState(durationInSeconds);
    const radius = 45;
    const circumference = 2 * Math.PI * radius;

    // Reset when duration or resetKey changes
    useEffect(() => {
        setTimeLeft(durationInSeconds);
    }, [durationInSeconds, resetKey]);

    // Single interval that decrements and stops at 0
    useEffect(() => {
        if (!durationInSeconds || durationInSeconds <= 0) return;
        let id = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(id);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(id);
    }, [durationInSeconds]);

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