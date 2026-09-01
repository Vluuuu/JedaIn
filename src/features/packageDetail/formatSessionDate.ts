/**
 * Deterministically formats session start and end timestamps in Asia/Jakarta timezone.
 * Handles both same-day sessions and cross-date sessions (e.g. 2D1N).
 */
export function formatSessionDateTimeRange(
  startAt: string,
  endAt: string,
): { dateLabel: string; isCrossDay: boolean } {
  const startDate = new Date(startAt);
  const endDate = new Date(endAt);

  // Compare local calendar dates in Asia/Jakarta timezone
  const startDayKey = startDate.toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  }); // YYYY-MM-DD
  const endDayKey = endDate.toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });

  const startDateFormatted = startDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  const startTimeFormatted = startDate.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  const endTimeFormatted = endDate.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  if (startDayKey === endDayKey) {
    // Same-day session
    return {
      dateLabel: `${startDateFormatted} • ${startTimeFormatted} - ${endTimeFormatted} WIB`,
      isCrossDay: false,
    };
  }

  // Cross-date session (e.g. 2D1N)
  const endDateFormatted = endDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  return {
    dateLabel: `${startDateFormatted} • ${startTimeFormatted} WIB → ${endDateFormatted} • ${endTimeFormatted} WIB`,
    isCrossDay: true,
  };
}
