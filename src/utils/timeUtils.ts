import { TimeCheckResult } from '../types';

/**
 * Parses "HH:mm" string into minutes from midnight (0 to 1439)
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Returns date in YYYY-MM-DD format (local timezone)
 */
export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date in full French text, e.g. "Jeudi 8 Octobre 2026"
 */
export function formatFrenchDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Format a Date to HH:mm:ss
 */
export function formatTimeWithSeconds(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * Core business rule verification:
 * Reservations are STRICTLY permitted only between bookingWindowStart (08:00) and bookingWindowEnd (10:00).
 */
export function evaluateBookingWindow(
  now: Date,
  windowStart: string = '08:00',
  windowEnd: string = '10:00'
): TimeCheckResult {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getSeconds();
  const totalCurrentSeconds = currentMinutes * 60 + currentSeconds;

  const startMins = timeStringToMinutes(windowStart);
  const endMins = timeStringToMinutes(windowEnd);

  const startSeconds = startMins * 60;
  const endSeconds = endMins * 60;

  const currentDisplayTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (totalCurrentSeconds < startSeconds) {
    const diffSec = startSeconds - totalCurrentSeconds;
    const hoursRemaining = Math.floor(diffSec / 3600);
    const minutesRemaining = Math.floor((diffSec % 3600) / 60);
    const secondsRemaining = diffSec % 60;

    const timeRemainingStr = hoursRemaining > 0 
      ? `${hoursRemaining}h ${minutesRemaining}min` 
      : `${minutesRemaining}min ${secondsRemaining}s`;

    return {
      isOpen: false,
      state: 'BEFORE_WINDOW',
      message: `Réservations fermées. Ouverture stricte à ${windowStart} (dans ${timeRemainingStr}).`,
      timeRemaining: timeRemainingStr,
      currentDisplayTime,
      startTime: windowStart,
      endTime: windowEnd,
    };
  }

  if (totalCurrentSeconds >= endSeconds) {
    return {
      isOpen: false,
      state: 'AFTER_WINDOW',
      message: `Réservations closes pour aujourd'hui. Clôture effectuée à ${windowEnd} pour l'organisation de la cuisine.`,
      currentDisplayTime,
      startTime: windowStart,
      endTime: windowEnd,
    };
  }

  // Inside the window (08:00:00 <= now < 10:00:00)
  const diffSec = endSeconds - totalCurrentSeconds;
  const hoursRemaining = Math.floor(diffSec / 3600);
  const minutesRemaining = Math.floor((diffSec % 3600) / 60);
  const secondsRemaining = diffSec % 60;

  const timeRemainingStr = hoursRemaining > 0 
    ? `${hoursRemaining}h ${String(minutesRemaining).padStart(2, '0')}m` 
    : `${minutesRemaining}min ${String(secondsRemaining).padStart(2, '0')}s`;

  return {
    isOpen: true,
    state: 'IN_WINDOW',
    message: `Réservations actives ! Clôture stricte à ${windowEnd} (temps restant : ${timeRemainingStr}).`,
    timeRemaining: timeRemainingStr,
    currentDisplayTime,
    startTime: windowStart,
    endTime: windowEnd,
  };
}
