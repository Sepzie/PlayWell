const BackgroundService = require('./BackgroundService.js');
const { LimitsService } = require('../services/limitsService.js');
const { UserRepository } = require('../repository/user.js');

// How often to resync with database (in seconds)
// Now that we calculate active sessions in real-time, we can sync less frequently
const DB_SYNC_INTERVAL_SECONDS = 10;

class TimerController extends BackgroundService {
    constructor() {
        super('TimerController');
        this.state = {
            hasLimit: false,
            isOverLimit: false,
            duration: 0,      // Limit duration in seconds
            timeLeft: 0       // Time remaining in seconds (negative when over limit)
        };
        this.wasOverLimit = false; // Track previous over-limit state
        this.tickCounter = 0; // Track ticks for DB sync timing
        this.isGaming = false; // Track if user is currently gaming
    }

    /**
     * Set gaming state - called when games start/stop
     */
    setGamingState(isGaming) {
        const changed = this.isGaming !== isGaming;
        this.isGaming = isGaming;

        if (changed) {
            // Force a DB sync when gaming state changes to get accurate values
            this.updateFromLimits();
        }
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

            // Get current limit status from DB (all values in seconds)
            const status = await LimitsService.getLimitStatus(user.id);

            // Update state
            this.state.hasLimit = status.hasLimit;
            this.state.isOverLimit = status.isOverLimit;
            this.state.duration = status.limitSeconds;
            this.state.timeLeft = status.remainingSeconds;

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
     * Only counts down when actively gaming.
     */
    _onIntervalTick() {
        this.tickCounter++;

        // Resync with DB every N seconds
        if (this.tickCounter >= DB_SYNC_INTERVAL_SECONDS) {
            this.updateFromLimits();
            return; // updateFromLimits will broadcast
        }

        // Local countdown: decrement timer only if gaming and we have a limit
        if (this.state.hasLimit && this.isGaming) {
            // Decrement local timer (can go negative when over limit)
            this.state.timeLeft--;

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
