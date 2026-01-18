/**
 * Date formatting utilities for displaying UTC timestamps in local timezone
 *
 * The backend stores all timestamps in UTC. These utilities convert them
 * to the user's local timezone (Sri Lanka: Asia/Colombo, UTC+5:30) for display.
 */

// Sri Lanka timezone
const SRI_LANKA_TIMEZONE = 'Asia/Colombo';

/**
 * Format a UTC date string to local date and time
 * Example output: "17 Jan 2026, 10:57 PM"
 */
export const formatDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleString('en-GB', {
      timeZone: SRI_LANKA_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '-';
  }
};

/**
 * Format a UTC date string to local date only
 * Example output: "17 Jan 2026"
 */
export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('en-GB', {
      timeZone: SRI_LANKA_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

/**
 * Format a UTC date string to local time only
 * Example output: "10:57 PM"
 */
export const formatTime = (dateString: string | undefined | null): string => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleTimeString('en-GB', {
      timeZone: SRI_LANKA_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '-';
  }
};

/**
 * Format a UTC date string to relative time (e.g., "2 hours ago", "3 days ago")
 * Falls back to formatted date if more than 7 days ago
 */
export const formatRelativeTime = (dateString: string | undefined | null): string => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    // More than 7 days, show full date
    return formatDate(dateString);
  } catch {
    return '-';
  }
};

/**
 * Format a UTC date string for order/transaction display
 * Shows date and time in a compact format
 * Example output: "17/01/2026 22:57"
 */
export const formatOrderDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleString('en-GB', {
      timeZone: SRI_LANKA_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '-';
  }
};

/**
 * Format a UTC date string for display with full month name
 * Example output: "17 January 2026"
 */
export const formatFullDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('en-GB', {
      timeZone: SRI_LANKA_TIMEZONE,
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};
