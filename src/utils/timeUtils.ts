import { TimeCheckResult, MealType, AppSettings } from '../types';

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

export interface MealScheduleInfo {
  mealType: MealType;
  label: string;
  shortLabel: string;
  icon: string;
  bookingStart: string;
  bookingEnd: string;
  serviceHours: string;
  capacity: number;
  timeStatus: TimeCheckResult;
}

/**
 * Returns complete schedule and real-time status for a specific meal
 */
export function getMealScheduleInfo(
  now: Date,
  mealType: MealType,
  settings: Partial<AppSettings> = {}
): MealScheduleInfo {
  let bookingStart = '08:00';
  let bookingEnd = '10:00';
  let serviceHours = '11h45 - 13h45';
  let capacity = settings.capacityPerDay || 75;
  let label = 'Menu du Déjeuner (Repas de midi)';
  let shortLabel = 'Déjeuner';
  let icon = '🍽️';

  if (mealType === 'breakfast') {
    bookingStart = settings.breakfastBookingStart || '06:30';
    bookingEnd = settings.breakfastBookingEnd || '09:00';
    serviceHours = settings.breakfastServiceHours || '07h00 - 09h00';
    capacity = settings.breakfastCapacity || 50;
    label = 'Petit-déjeuner du Matin';
    shortLabel = 'Petit-déj';
    icon = '🥐';
  } else if (mealType === 'dinner') {
    bookingStart = settings.dinnerBookingStart || '14:00';
    bookingEnd = settings.dinnerBookingEnd || '18:00';
    serviceHours = settings.dinnerServiceHours || '19h00 - 21h00';
    capacity = settings.dinnerCapacity || 50;
    label = 'Menu du Soir (Dîner)';
    shortLabel = 'Dîner';
    icon = '🌙';
  } else {
    // Lunch
    bookingStart = settings.bookingWindowStart || '08:00';
    bookingEnd = settings.bookingWindowEnd || '10:00';
    serviceHours = settings.serviceHours || '11h45 - 13h45';
    capacity = settings.lunchCapacity || settings.capacityPerDay || 75;
    label = 'Menu du Déjeuner (Repas de midi)';
    shortLabel = 'Déjeuner';
    icon = '🍽️';
  }

  const baseResult = evaluateBookingWindow(now, bookingStart, bookingEnd);

  let message = baseResult.message;
  if (baseResult.state === 'BEFORE_WINDOW') {
    message = `Réservations ${label} fermées. Ouverture stricte à ${bookingStart} (dans ${baseResult.timeRemaining}).`;
  } else if (baseResult.state === 'AFTER_WINDOW') {
    message = `Réservations ${label} closes pour aujourd'hui. Clôture effectuée à ${bookingEnd} pour la cuisine.`;
  } else {
    message = `Réservations ${label} ouvertes ! Clôture à ${bookingEnd} (reste : ${baseResult.timeRemaining}).`;
  }

  const enrichedTimeStatus: TimeCheckResult = {
    ...baseResult,
    message,
    mealType,
    mealLabel: label,
  };

  return {
    mealType,
    label,
    shortLabel,
    icon,
    bookingStart,
    bookingEnd,
    serviceHours,
    capacity,
    timeStatus: enrichedTimeStatus,
  };
}

/**
 * Returns the status for all 3 meals simultaneously
 */
export function getAllMealSchedules(
  now: Date,
  settings: Partial<AppSettings> = {}
): Record<MealType, MealScheduleInfo> {
  return {
    breakfast: getMealScheduleInfo(now, 'breakfast', settings),
    lunch: getMealScheduleInfo(now, 'lunch', settings),
    dinner: getMealScheduleInfo(now, 'dinner', settings),
  };
}

