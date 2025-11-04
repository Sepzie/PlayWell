const BackgroundService = require('./BackgroundService.js');
const { LimitsService } = require('../services/limitsService.js');
const { UserRepository } = require('../repository/user.js');

class TimerController extends BackgroundService {
    constructor() {
        super('TimerController');
        this.state = {
            hasLimit: false,
            limitMinutes: 0,
            playedMinutes: 0,
            remainingMinutes: 0,
            isOverLimit: false,
            // Legacy fields for backwards compatibility (converted to seconds)
            duration: 0,
            timeLeft: 0,
            running: false
        };
        this.wasOverLimit = false; // Track previous over-limit state
    }

    _broadcast() {
        this.emit('update', { ...this.state });
    }

    /**
     * Start the timer - it will auto-update based on limits and playtime
     */
    start() {
        super.start();
        this._startInterval(10000); // Update every 10 seconds
        this.updateFromLimits(); // Initial update
    }

    /**
     * Updates timer state by fetching current limit status from LimitsService.
     * This replaces the old manual countdown logic.
     */
    async updateFromLimits() {
        try {
            const user = UserRepository.getCurrentUser();
            if (!user) {
                this._log('warn', 'No user loaded, cannot update limits');
                return;
            }

            // Get current limit status
            const status = await LimitsService.getLimitStatus(user.id);

            // Update state
            this.state.hasLimit = status.hasLimit;
            this.state.limitMinutes = status.limitMinutes;
            this.state.playedMinutes = status.playedMinutes;
            this.state.remainingMinutes = status.remainingMinutes;
            this.state.isOverLimit = status.isOverLimit;

            // Convert to seconds for legacy compatibility
            this.state.duration = status.limitMinutes * 60;
            this.state.timeLeft = status.remainingMinutes * 60;
            this.state.running = status.hasLimit; // Running if there's a limit

            // Check if over-limit state changed
            if (status.isOverLimit !== this.wasOverLimit) {
                this.wasOverLimit = status.isOverLimit;
                this.emit('over-limit-changed', { isOverLimit: status.isOverLimit });
                this._log('info', `Over-limit state changed: ${status.isOverLimit ? 'OVER LIMIT' : 'within limit'}`);
            }

            this._broadcast();
        } catch (err) {
            this._log('error', 'updateFromLimits error', err);
        }
    }

    /**
     * Legacy method - kept for backward compatibility but now triggers limit update
     */
    setup(durationSeconds) {
        this._log('info', 'Legacy setup() called, updating from limits instead');
        this.updateFromLimits();
    }

    /**
     * Legacy methods - kept for backward compatibility
     */
    resume() {
        this._log('info', 'Legacy resume() called');
        this.updateFromLimits();
    }

    pause() {
        this._log('info', 'Legacy pause() called');
        this.updateFromLimits();
    }

    reset() {
        this._log('info', 'Legacy reset() called');
        this.updateFromLimits();
    }

    getState() {
        return { ...this.state };
    }

    _onIntervalTick() {
        // Update from limits service on each tick
        this.updateFromLimits();
    }
}

const timer = new TimerController();
module.exports = timer;
