export const WORKOUT_TYPES = ["run", "walk", "cycle", "other"];
export const DISTANCE_MAX_MILES = 500;
export const DURATION_MAX_MINUTES = 1440;
export const NOTES_MAX = 500;
const EARLIEST_DATE = "2000-01-01";

/** Calendar date as YYYY-MM-DD in the device's time zone. */
export function todayString(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * @param {{ activityType?: unknown, distanceMiles?: unknown, durationMinutes?: unknown, workoutDate?: unknown, notes?: unknown }} values
 * @param {string} today latest allowed date, YYYY-MM-DD
 * @returns {Record<string, string>}
 */
export function validateWorkout(values, today = todayString()) {
  const errors = {};
  if (!WORKOUT_TYPES.includes(values?.activityType))
    errors.activityType = "Choose run, walk, cycle, or other.";
  const distance = values?.distanceMiles;
  if (typeof distance !== "number" || !Number.isFinite(distance) || distance < 0 || distance > DISTANCE_MAX_MILES)
    errors.distanceMiles = `Distance must be between 0 and ${DISTANCE_MAX_MILES} miles.`;
  const duration = values?.durationMinutes;
  if (!Number.isInteger(duration) || duration < 1 || duration > DURATION_MAX_MINUTES)
    errors.durationMinutes = `Duration must be a whole number from 1 to ${DURATION_MAX_MINUTES} minutes.`;
  const date = values?.workoutDate;
  if (!isCalendarDate(date) || date < EARLIEST_DATE || date > today)
    errors.workoutDate = "Enter the date as YYYY-MM-DD, no later than today.";
  const notes = values?.notes;
  if (notes != null && (typeof notes !== "string" || notes.trim().length > NOTES_MAX))
    errors.notes = `Notes can be up to ${NOTES_MAX} characters.`;
  return errors;
}
