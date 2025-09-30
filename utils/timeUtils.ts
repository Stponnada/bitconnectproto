import { formatDistanceToNow, differenceInDays, format } from 'date-fns';

export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const daysDifference = differenceInDays(new Date(), date);

  if (daysDifference < 1) {
    // If it's less than a day, show relative time like "5 hours ago"
    return formatDistanceToNow(date, { addSuffix: true });
  } else if (daysDifference < 7) {
    // If it's within a week, show "X days ago"
    return `${daysDifference} day${daysDifference > 1 ? 's' : ''} ago`;
  } else {
    // If it's older than a week, show the actual date like "Sep 30"
    return format(date, 'MMM d');
  }
};