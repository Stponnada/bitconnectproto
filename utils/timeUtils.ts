// src/utils/timeUtils.ts

import { formatDistanceToNow, differenceInDays, format } from 'date-fns';

/**
 * Formats a timestamp into a relative time string (e.g., "5 hours ago").
 * If the timestamp is older than a week, it shows the date (e.g., "Sep 30").
 */
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const daysDifference = differenceInDays(new Date(), date);

  if (daysDifference < 1) {
    return formatDistanceToNow(date, { addSuffix: true });
  } else if (daysDifference < 7) {
    return `${daysDifference} day${daysDifference > 1 ? 's' : ''} ago`;
  } else {
    return format(date, 'MMM d');
  }
};

/**
 * Formats a timestamp into an exact, detailed string.
 * Example: "3:45 PM · Sep 30, 2025"
 */
export const formatExactTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return format(date, "h:mm a · MMM d, yyyy");
};