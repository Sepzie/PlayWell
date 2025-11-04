const BackgroundService = require('./BackgroundService.js');
const { LimitsService } = require('../services/limitsService.js');
const { UserRepository } = require('../repository/user.js');

// How often to resync with database (in seconds)
const DB_SYNC_INTERVAL_SECONDS = 30;

class TimerController extends BackgroundService {
    constructor() {
        super('TimerController');
        this.state = {
            hasLimit: false,
            limitMinutes: 0,
            playedMinutes: 0,
            remainingMinutes: 0,
            isOverLimit: false,
            // UI-friendly fields in seconds
            duration: 0,
            timeLeft: 0
        };
        this.wasOverLimit = false; // Track previous over-limit state
        this.tickCounter = 0; // Track ticks for DB sync timing
    }

    _broadcast() {
        this.emit('update', { ...this.state });
    }

    /**
     * Start the timer - ticks every second for smooth UI, resyncs with DB periodically
     */
    start() {
        super.start();
        this._startInterval(1000); // Tick every second for smooth countdown
        this.updateFromLimits(); // Initial DB sync
    }

    /**
     * Updates timer state by fetching current limit status from LimitsService.
     * Resyncs local countdown with accurate DB values.
     */
    async updateFromLimits() {
        try {
            const user = UserRepository.getCurrentUser();
            if (!user) {
                this._log('warn', 'No user loaded, cannot update limits');
                return;
            }

            // Get current limit status from DB
            const status = await LimitsService.getLimitStatus(user.id);

            // Update state with DB values
            this.state.hasLimit = status.hasLimit;
            this.state.limitMinutes = status.limitMinutes;
            this.state.playedMinutes = status.playedMinutes;
            this.state.remainingMinutes = status.remainingMinutes;
            this.state.isOverLimit = status.isOverLimit;

            // Convert to seconds for UI
            this.state.duration = status.limitMinutes * 60;
            this.state.timeLeft = status.remainingMinutes * 60;

            // Check if over-limit state changed
            if (status.isOverLimit !== this.wasOverLimit) {
                this.wasOverLimit = status.isOverLimit;
                this.emit('over-limit-changed', { isOverLimit: status.isOverLimit });
                this._log('info', `Over-limit state changed: ${status.isOverLimit ? 'OVER LIMIT' : 'within limit'}`);
            }

            // Reset tick counter after DB sync
            this.tickCounter = 0;

            this._broadcast();
        } catch (err) {
            this._log('error', 'updateFromLimits error', err);
        }
    }

    /**
     * Forces an immediate update from limits (useful after changing limits)
     */
    forceUpdate() {
        this._log('info', 'Force update requested');
        this.updateFromLimits();
    }

    getState() {
        return { ...this.state };
    }

    /**
     * Called every second for smooth countdown.
     * Periodically resyncs with DB for accuracy.
     */
    _onIntervalTick() {
        this.tickCounter++;

        // Resync with DB every N seconds
        if (this.tickCounter >= DB_SYNC_INTERVAL_SECONDS) {
            this.updateFromLimits();
            return; // updateFromLimits will broadcast
        }

        // Local countdown: decrement timeLeft if we have a limit
        if (this.state.hasLimit) {
            // Decrement local timer (can go negative when over limit)
            this.state.timeLeft--;

            // Update remaining minutes for consistency
            this.state.remainingMinutes = Math.round(this.state.timeLeft / 60);

            // Check if we just crossed the limit threshold
            const isNowOverLimit = this.state.timeLeft < 0;
            if (isNowOverLimit !== this.state.isOverLimit) {
                this.state.isOverLimit = isNowOverLimit;

                // Emit over-limit change event
                if (isNowOverLimit !== this.wasOverLimit) {
                    this.wasOverLimit = isNowOverLimit;
                    this.emit('over-limit-changed', { isOverLimit: isNowOverLimit });
                    this._log('info', `Over-limit state changed: ${isNowOverLimit ? 'OVER LIMIT' : 'within limit'}`);
                }
            }

            this._broadcast();
        }
    }
}

const timer = new TimerController();
module.exports = timer;
