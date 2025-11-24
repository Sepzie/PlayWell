const { GamingSessionRepository } = require('../repository/gamingSession.js');
const { debug_colors } = require('../../src/theme/colors.js');
const { session } = require('electron');
const { service, reset, err } = debug_colors;

/**
 * StatsService - Business logic layer for gaming statistics and history data.
 * Handles date parsing, session splitting across boundaries, and aggregation.
 */
const StatsService = {
    getGameStats: async (options) => { return []; },
    getHistoryData: async (options) => { return {}; }
};

/**
 * Parses period options into start and end dates.
 *
 * @param {Object} options - Options object with period, customStart, customEnd
 * @returns {Object} { startDate, endDate }
 */
function parseDateRange(options) {
    const { period = 'today', customStart, customEnd, year, month } = options;
    const now = new Date();
    let startDate, endDate;

    // Set endDate to end of current day by default
    endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
        case 'today':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            break;

        case 'week':
            startDate = new Date(now);
            // Get to start of week (Sunday)
            const dayOfWeek = startDate.getDay();
            startDate.setDate(startDate.getDate() - dayOfWeek);
            startDate.setHours(0, 0, 0, 0);
            break;

        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            break;

        case 'year':
            // Full year from Jan 1 to Dec 31
            const selectedYear = year || now.getFullYear();
            startDate = new Date(selectedYear, 0, 1); // Jan 1
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(selectedYear, 11, 31); // Dec 31
            endDate.setHours(23, 59, 59, 999);
            break;

        case 'total':
            // Get all records from year 0
            startDate = new Date(0, 0, 1);
            startDate.setHours(0, 0, 0, 0);

            // Until the year 9999
            endDate = new Date(9999, 11, 31);
            endDate.setHours(23, 59, 59, 999);
            break;

        case 'specific-month':
            // Specific month (for monthly breakdown in history)
            const selectedYear2 = year || now.getFullYear();
            const selectedMonth = month !== undefined ? month : now.getMonth();
            startDate = new Date(selectedYear2, selectedMonth, 1);
            startDate.setHours(0, 0, 0, 0);
            // End date is last day of that month
            endDate = new Date(selectedYear2, selectedMonth + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            break;

        case 'custom':
            if (!customStart || !customEnd) {
                throw new Error('Custom period requires customStart and customEnd dates');
            }
            startDate = new Date(customStart);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(customEnd);
            endDate.setHours(23, 59, 59, 999);
            break;

        default:
            throw new Error(`Unknown period: ${period}`);
    }

    return { startDate, endDate };
}

/**
 * Calculates overlap between a session and a time bucket.
 * Returns minutes spent in the bucket.
 *
 * @param {Date} sessionStart - Session start time
 * @param {Date} sessionEnd - Session end time
 * @param {Date} bucketStart - Bucket start time
 * @param {Date} bucketEnd - Bucket end time
 * @returns {number} Minutes of overlap
 */
function calculateOverlap(sessionStart, sessionEnd, bucketStart, bucketEnd) {
    // Find the actual overlap period
    const overlapStart = sessionStart > bucketStart ? sessionStart : bucketStart;
    const overlapEnd = sessionEnd < bucketEnd ? sessionEnd : bucketEnd;

    // No overlap
    if (overlapStart >= overlapEnd) {
        return 0;
    }

    // Calculate minutes of overlap
    const overlapMs = overlapEnd - overlapStart;
    return overlapMs / (1000 * 60); // Convert to minutes
}

/**
 * Gets aggregated gaming statistics for all games within a date range.
 * Accurately splits sessions across date boundaries.
 *
 * @param {Object} options - { period, customStart, customEnd }
 * @returns {Array} Array of game stats: [{ name, playTime, dailyAverage, averageDaysPerWeek }]
 */
StatsService.getGameStats = async (options) => {
    try {
        const { startDate, endDate } = parseDateRange(options);

        // Get all sessions from database (these are being updated in real-time by GameTracker)
        const sessions = await GamingSessionRepository.getAllGamingSessions();

        // Filter to sessions that overlap with our date range
        const relevantSessions = sessions.filter(session => {
            const sessionStart = new Date(session.startTime);
            const sessionEnd = new Date(session.endTime);
            // Session overlaps if it starts before range ends AND ends after range starts
            return sessionStart <= endDate && sessionEnd >= startDate;
        });

        // Group by game and aggregate
        const gameStatsMap = {};

        relevantSessions.forEach(session => {
            const sessionStart = new Date(session.startTime);
            const sessionEnd = new Date(session.endTime);
            const gameId = session.gameId;
            const gameName = session.gamePlayed?.name || 'Unknown Game';

            // Skip sessions with no duration
            if (!session.durationSeconds || session.durationSeconds <= 0) {
                return;
            }

            // Calculate how much time was spent in our date range (in minutes for display)
            const timeInRange = calculateOverlap(sessionStart, sessionEnd, startDate, endDate);

            if (timeInRange <= 0) {
                return; // No overlap with our range
            }

            // Initialize game stats if needed
            if (!gameStatsMap[gameId]) {
                gameStatsMap[gameId] = {
                    name: gameName,
                    totalPlayTime: 0,
                    playDates: new Set(),
                    sessionsCount: 0
                };
            }

            gameStatsMap[gameId].totalPlayTime += timeInRange;
            gameStatsMap[gameId].sessionsCount++;

            // Track unique days played (iterate through each day the session touches)
            let currentDay = new Date(Math.max(sessionStart, startDate));
            currentDay.setHours(0, 0, 0, 0);

            const lastDay = new Date(Math.min(sessionEnd, endDate));
            lastDay.setHours(0, 0, 0, 0);

            while (currentDay <= lastDay) {
                const dayKey = currentDay.toISOString().split('T')[0];
                gameStatsMap[gameId].playDates.add(dayKey);
                currentDay.setDate(currentDay.getDate() + 1);
            }
        });

        // Calculate final stats
        const stats = Object.values(gameStatsMap).map(game => {
            const totalPlayTime = game.totalPlayTime;
            const uniqueDaysPlayed = game.playDates.size;
            const sessionsCount = game.sessionsCount;

            // Daily average: total playtime / days actually played
            const dailyAverage = uniqueDaysPlayed > 0 ? totalPlayTime / uniqueDaysPlayed : 0;

            // Average Session Length
            // Accounts for multiple sessions in one day
            const averageSessionLength = sessionsCount > 0 ? totalPlayTime / sessionsCount : 0;

            return {
                name: game.name,
                playTime: Math.round(totalPlayTime),
                dailyAverage: Math.round(dailyAverage),
                averageSessionLength: Math.round(averageSessionLength)
            };
        });

        console.info(`${service}[StatsService]${reset} Returning ${stats.length} games`);
        return stats;

    } catch (error) {
        console.error(`${service}[StatsService]${err} Error getting game stats:${reset}`, error);
        return [];
    }
};

/**
 * Gets history data broken down by time granularity.
 * Accurately splits sessions across time boundaries.
 *
 * @param {Object} options - { period, year, month, granularity }
 *   - granularity: 'day' (for monthly view) or 'month' (for yearly view)
 * @returns {Object} { labels: [...], data: [...] } for chart display
 */
StatsService.getHistoryData = async (options) => {
    try {
        const { granularity = 'day' } = options;
        const { startDate, endDate } = parseDateRange(options);

        // Get all sessions
        const sessions = await GamingSessionRepository.getAllGamingSessions();

        // Filter to sessions that overlap with our date range
        const relevantSessions = sessions.filter(session => {
            const sessionStart = new Date(session.startTime);
            const sessionEnd = new Date(session.endTime);
            return sessionStart <= endDate && sessionEnd >= startDate;
        });

        // Create time buckets based on granularity
        const buckets = {};
        const labels = [];

        if (granularity === 'day') {
            // Create a bucket for each day in the range
            let currentDay = new Date(startDate);
            while (currentDay <= endDate) {
                const dayKey = currentDay.toISOString().split('T')[0];
                buckets[dayKey] = 0;
                labels.push(currentDay.getDate()); // Just the day number (1-31)
                currentDay.setDate(currentDay.getDate() + 1);
            }
        } else if (granularity === 'month') {
            // Create a bucket for each month in the range
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
            const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

            while (currentMonth <= endMonth) {
                const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
                buckets[monthKey] = 0;
                labels.push(monthNames[currentMonth.getMonth()]);
                currentMonth.setMonth(currentMonth.getMonth() + 1);
            }
        }

        // Distribute session time into buckets
        relevantSessions.forEach(session => {
            const sessionStart = new Date(session.startTime);
            const sessionEnd = new Date(session.endTime);

            if (!session.durationSeconds || session.durationSeconds <= 0) {
                return;
            }

            // For each bucket, calculate overlap
            Object.keys(buckets).forEach(bucketKey => {
                let bucketStart, bucketEnd;

                if (granularity === 'day') {
                    // Bucket is a single day
                    bucketStart = new Date(bucketKey);
                    bucketStart.setHours(0, 0, 0, 0);
                    bucketEnd = new Date(bucketKey);
                    bucketEnd.setHours(23, 59, 59, 999);
                } else if (granularity === 'month') {
                    // Bucket is a full month
                    const [year, month] = bucketKey.split('-');
                    bucketStart = new Date(parseInt(year), parseInt(month) - 1, 1);
                    bucketStart.setHours(0, 0, 0, 0);
                    bucketEnd = new Date(parseInt(year), parseInt(month), 0); // Last day of month
                    bucketEnd.setHours(23, 59, 59, 999);
                }

                const overlapMinutes = calculateOverlap(sessionStart, sessionEnd, bucketStart, bucketEnd);
                buckets[bucketKey] += overlapMinutes;
            });
        });

        // Convert to hours for display
        const data = Object.values(buckets).map(minutes => parseFloat((minutes / 60).toFixed(1)));

        console.info(`${service}[StatsService]${reset} Returning history data with ${labels.length} buckets`);
        return { labels, data };

    } catch (error) {
        console.error(`${service}[StatsService]${err} Error getting history data:${reset}`, error);
        return { labels: [], data: [] };
    }
};

StatsService.getOldestAndNewestSessionDates = async () => {
    try {
        // Get all sessions
        const sessions = await GamingSessionRepository.getAllGamingSessions();
        let oldestSessionDate = sessions[0].startTime;
        let newestSessionDate = sessions[0].startTime; 

        sessions.forEach(session => {
            if (session.startTime < oldestSessionDate) {
                oldestSessionDate = session.startTime;
            }
            else if (session.startTime > newestSessionDate) {
                newestSessionDate = session.startTime;
            }
        })

        console.info(`${service}[StatsService]${reset} Returning oldest & newest sessions`);
        return { oldestSessionDate, newestSessionDate };

    } catch (error) {
        console.error(`${service}[StatsService]${err} Error getting oldest & newest sessions:${reset}`, error);
        return { oldestSessionDate: undefined, newestSessionDate: undefined };
    }
};

module.exports = { StatsService };
