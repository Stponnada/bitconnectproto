// src/utils/timeUtils.ts

import { 
    format, 
    differenceInSeconds, 
    differenceInMinutes, 
    differenceInHours, 
    differenceInDays, 
    differenceInMonths 
} from 'date-fns';

/**
 * Formats a timestamp into a short, abbreviated relative time string.
 * Examples: "5s", "10m", "3h", "2d", "4mo"
 * Falls back to "MMM d" for anything over a year.
 */
export const formatTimestamp = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);

  const seconds = differenceInSeconds(now, date);
  if (seconds < 60) return `${seconds}s`;

  const minutes = differenceInMinutes(now, date);
  if (minutes < 60) return `${minutes}m`;

  const hours = differenceInHours(now, date);
  if (hours < 24) return `${hours}h`;

  const days = differenceInDays(now, date);
  if (days < 30) return `${days}d`;
  
  const months = differenceInMonths(now, date);
  if (months < 12) return `${months}mo`;

  return format(date, 'MMM d, yyyy');
};

/**
 * Formats a timestamp into an exact, detailed string.
 * Example: "3:45 PM · Sep 30, 2025"
 */
export const formatExactTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return format(date, "h:mm a · MMM d, yyyy");
};