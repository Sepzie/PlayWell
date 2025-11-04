/**
 * Formats minutes into "Xh Ym" format
 * @param {number} minutes - Total minutes
 * @returns {string} Formatted string like "2h 30m" or "0h 45m"
 */
export function formatMinutesToHoursMinutes(minutes) {
  if (minutes === null || minutes === undefined || minutes < 0) {
    return "0h 0m";
  }

  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);

  return `${hours}h ${mins}m`;
}

/**
 * Formats minutes into hours with decimal (for display purposes)
 * @param {number} minutes - Total minutes
 * @returns {string} Formatted string like "2.5 Hours"
 */
export function formatMinutesToDecimalHours(minutes) {
  if (minutes === null || minutes === undefined || minutes < 0) {
    return "0 Hours";
  }

  const hours = (minutes / 60).toFixed(1);
  return `${hours} Hours`;
}
