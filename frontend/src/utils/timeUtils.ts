/**
 * Civil Defense Clock - Timezone-Free Time Utilities
 * 
 * All times are stored and calculated as simple strings in HH:mm format
 * All dates are stored as YYYY-MM-DD strings
 * No timezone conversions, no moment.js, no Date objects for time calculations
 */

/**
 * Convert time string (HH:mm) to minutes since midnight
 * @param time - Time in format "HH:mm" (e.g., "08:00", "23:30")
 * @returns Minutes since midnight (e.g., 480 for "08:00")
 */
export function timeToMinutes(time: string): number {
  // Allow "HH:mm" or "YYYY-MM-DDTHH:mm"
  if (time.includes('T')) {
    time = time.split('T')[1];   // keep only "HH:mm"
  }
  
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:mm)
 * @param minutes - Minutes since midnight
 * @returns Time in format "HH:mm"
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Calculate hours between two times (handles midnight crossing)
 * @param startTime - Start time in format "HH:mm"
 * @param endTime - End time in format "HH:mm"
 * @returns Number of hours (rounded)
 * 
 * @example
 * calculateHours("08:00", "10:00") // Returns 2
 * calculateHours("22:00", "02:00") // Returns 4 (crosses midnight)
 * calculateHours("10:00", "08:00") // Returns 22 (crosses midnight)
 */
export function calculateHours(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  let diff = endMinutes - startMinutes;

  if (diff < 0) {
    diff += 24 * 60;  // handles overnight shifts
  }

  return Math.round(diff / 60);
}

/**
 * Check if a time range crosses midnight
 * @param startTime - Start time in format "HH:mm"
 * @param endTime - End time in format "HH:mm"
 * @returns True if end time is before start time (crosses midnight)
 * 
 * @example
 * crossesMidnight("08:00", "10:00") // false
 * crossesMidnight("22:00", "02:00") // true
 */
export function crossesMidnight(startTime: string, endTime: string): boolean {
  return timeToMinutes(endTime) < timeToMinutes(startTime);
}

/**
 * Compare two times
 * @param time1 - First time in format "HH:mm"
 * @param time2 - Second time in format "HH:mm"
 * @returns -1 if time1 < time2, 0 if equal, 1 if time1 > time2
 * 
 * @example
 * compareTimes("08:00", "10:00") // -1
 * compareTimes("10:00", "08:00") // 1
 * compareTimes("08:00", "08:00") // 0
 */
export function compareTimes(time1: string, time2: string): number {
  const min1 = timeToMinutes(time1);
  const min2 = timeToMinutes(time2);
  
  if (min1 < min2) return -1;
  if (min1 > min2) return 1;
  return 0;
}

/**
 * Check if a time is between two other times (handles midnight crossing)
 * @param time - Time to check
 * @param rangeStart - Start of range
 * @param rangeEnd - End of range
 * @returns True if time is within range
 * 
 * @example
 * isTimeBetween("09:00", "08:00", "10:00") // true
 * isTimeBetween("23:00", "22:00", "02:00") // true (crosses midnight)
 * isTimeBetween("03:00", "22:00", "02:00") // false
 */
export function isTimeBetween(time: string, rangeStart: string, rangeEnd: string): boolean {
  const timeMin = timeToMinutes(time);
  const startMin = timeToMinutes(rangeStart);
  const endMin = timeToMinutes(rangeEnd);
  
  if (crossesMidnight(rangeStart, rangeEnd)) {
    // Range crosses midnight
    return timeMin >= startMin || timeMin <= endMin;
  } else {
    // Normal range
    return timeMin >= startMin && timeMin <= endMin;
  }
}

/**
 * Get current date in YYYY-MM-DD format (Lebanon time)
 * @returns Date string
 */
export function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current time in HH:mm format (Lebanon time)
 * @returns Time string
 */
export function getCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Validate time format (HH:mm)
 * @param time - Time string to validate
 * @returns True if valid
 */
export function isValidTime(time: string): boolean {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param date - Date string to validate
 * @returns True if valid
 */
export function isValidDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  // Check if it's a real date
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  return dateObj.getFullYear() === year &&
         dateObj.getMonth() === month - 1 &&
         dateObj.getDate() === day;
}

/**
 * Format date for display in Arabic
 * @param date - Date in YYYY-MM-DD format
 * @returns Formatted date string
 */
export function formatDateArabic(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const monthNames = [
    'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
    'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
  ];
  
  return `${day} ${monthNames[month - 1]} ${year}`;
}

/**
 * Add days to a date
 * @param date - Date in YYYY-MM-DD format
 * @param days - Number of days to add
 * @returns New date string
 */
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  dateObj.setDate(dateObj.getDate() + days);
  
  const newYear = dateObj.getFullYear();
  const newMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
  const newDay = String(dateObj.getDate()).padStart(2, '0');
  
  return `${newYear}-${newMonth}-${newDay}`;
}

/**
 * Get days between two dates
 * @param date1 - First date in YYYY-MM-DD format
 * @param date2 - Second date in YYYY-MM-DD format
 * @returns Number of days (can be negative)
 */
export function daysBetween(date1: string, date2: string): number {
  const [y1, m1, d1] = date1.split('-').map(Number);
  const [y2, m2, d2] = date2.split('-').map(Number);
  
  const dateObj1 = new Date(y1, m1 - 1, d1);
  const dateObj2 = new Date(y2, m2 - 1, d2);
  
  const diffTime = dateObj2.getTime() - dateObj1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate which team should work on a given date
 * Reference: Jan 1, 2026 = Team 2, Jan 2 = Team 3, Jan 3 = Team 1, etc.
 * Pattern cycles every 3 days
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Team number ('1', '2', or '3')
 */
export function getTeamForDate(dateString: string): '1' | '2' | '3' {
  // Parse the date string manually to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Use UTC dates to avoid timezone shifts
  const referenceDate = new Date(Date.UTC(2025, 11, 31)); // Dec 31, 2025 = Team 1
  const targetDate = new Date(Date.UTC(year, month - 1, day));
  
  // Calculate days difference
  const daysDiff = Math.round((targetDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Teams cycle: Team1 (daysDiff=0), Team2 (daysDiff=1), Team3 (daysDiff=2), Team1 (daysDiff=3), etc.
  // So: (daysDiff + 1) % 3 gives us 1, 2, 0, 1, 2, 0...
  // But we want teams indexed as 0='1', 1='2', 2='3'
  // So: daysDiff % 3 gives us 0, 1, 2, 0, 1, 2...
  const teamIndex = daysDiff % 3;
  const teams: ('1' | '2' | '3')[] = ['1', '2', '3'];
  return teams[teamIndex];
}