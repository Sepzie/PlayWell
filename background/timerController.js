const { EventEmitter } = require('events');

const MAX_SECONDS = 24 * 3600;

class TimerController extends EventEmitter {
    constructor() {
        super();
        this.state = { duration: 0, timeLeft: 0, running: false };
        this._interval = null;
    }

    _broadcast() {
        this.emit('update', { ...this.state });
    }

    setup(durationSeconds) {
        try {
            // Setup timer with new duration
            this.clearInterval();
            this.state.duration = Math.max(0, Math.min(MAX_SECONDS, Number(durationSeconds) || 0));
            this.state.timeLeft = this.state.duration;
            this._broadcast();

            // Start interval, not necessarily running
            this._startInterval();
        } catch (err) {
            console.error('TimerController.setup error', err);
        }
    }

    resume() {
        this.state.running = true;
        this._broadcast();
    }

    pause() {
        this.state.running = false;
        this._broadcast();
    }

    reset() {
        this.state.timeLeft = this.state.duration;
        this._broadcast();
    }

    getState() {
        return { ...this.state };
    }

    _startInterval() {
        if (this._interval) return;
        this._interval = setInterval(() => {
            // Decrement time left if running
            if (this.state.running) {
                this.state.timeLeft = Math.max(0, this.state.timeLeft - 1);

                // Stop timer if time's up
                if (this.state.timeLeft <= 0) {
                    this.clearInterval();
                    this.state.running = false;
                }
                
                // Broadcast updated state
                this._broadcast();
            }
        }, 1000);
    }

    clearInterval() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
    }
}

const timer = new TimerController();
module.exports = timer;
