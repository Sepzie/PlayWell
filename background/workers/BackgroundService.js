const { EventEmitter } = require('events');

/**
 * Base class for background services that run periodic tasks.
 * Provides common functionality for interval management, logging, and lifecycle.
 */
class BackgroundService extends EventEmitter {
    constructor(serviceName) {
        super();
        this.serviceName = serviceName || 'BackgroundService';
        this._interval = null;
        this._intervalMs = null;
    }

    /**
     * Starts the service interval with the specified period.
     * Subclasses should override _onIntervalTick() to define behavior.
     *
     * @param {number} intervalMs - Interval period in milliseconds
     */
    _startInterval(intervalMs) {
        if (this._interval) {
            this._log('warn', 'Interval already running, clearing first');
            this.clearInterval();
        }

        this._intervalMs = intervalMs;
        this._interval = setInterval(() => {
            this._onIntervalTick();
        }, intervalMs);
    }

    /**
     * Called on each interval tick. Override this in subclasses.
     */
    _onIntervalTick() {
        // Override in subclass
    }

    /**
     * Clears the running interval if one exists.
     */
    clearInterval() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
    }

    /**
     * Checks if the service is currently running.
     *
     * @returns {boolean} true if interval is active
     */
    isRunning() {
        return this._interval !== null;
    }

    /**
     * Logs a message with service name prefix.
     *
     * @param {string} level - Log level ('info', 'warn', 'error')
     * @param {string} message - Message to log
     * @param {...any} args - Additional arguments to log
     */
    _log(level, message, ...args) {
        const prefix = `[${this.serviceName}]`;

        switch (level) {
            case 'error':
                console.error(prefix, message, ...args);
                break;
            case 'warn':
                console.warn(prefix, message, ...args);
                break;
            case 'info':
            default:
                console.info(prefix, message, ...args);
                break;
        }
    }

    /**
     * Lifecycle method called when service starts.
     * Override in subclasses to add initialization logic.
     */
    start() {
        // Override in subclasses if needed
    }

    /**
     * Lifecycle method called when service stops.
     * Override in subclasses to add cleanup logic.
     */
    stop() {
        this.clearInterval();
    }
}

module.exports = BackgroundService;
