import { getNowIST } from "./ist";

/**
 * Checks if the doctor's real-time settings indicate they are available right now.
 * 
 * @param isAvailable Boolean indicating if the doctor has toggled themselves absent.
 * @param startTime String in 'HH:mm' format (24-hour).
 * @param endTime String in 'HH:mm' format (24-hour).
 * @returns boolean True if available and within working hours.
 */
export function isDoctorAvailableNow(
  isAvailable: boolean,
  startTime: string,
  endTime: string
): boolean {
  if (!isAvailable) return false;

  // Check bounds using IST. Time format is 'HH:mm'
  const timeIST = getNowIST();
  const currentTotalMins = (timeIST.getHours() * 60) + timeIST.getMinutes();

  const parseMins = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60) + (m || 0);
  };

  const startMins = parseMins(startTime);
  const endMins = parseMins(endTime);

  // Consider boundary wrap around cases if working overnight (rare for doctors, but covers shift logic)
  if (startMins <= endMins) {
    return currentTotalMins >= startMins && currentTotalMins <= endMins;
  } else {
    // Overnight shift: e.g. 22:00 to 06:00
    return currentTotalMins >= startMins || currentTotalMins <= endMins;
  }
}
