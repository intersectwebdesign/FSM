/**
 * All scheduling in this app is single-timezone (one company, one region).
 * `datetime-local` inputs carry no timezone info, and formatting a stored
 * timestamp with the viewer's own device timezone made times drift
 * depending on who/where was looking. Every read and write of a
 * user-entered schedule time goes through this fixed business timezone
 * instead, so "2pm" always means the same instant everywhere.
 */
export const BUSINESS_TIMEZONE = "Australia/Adelaide";

function offsetMinutesAt(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(instant)
    .reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    parts.hour === "24" ? 0 : Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return (asUtc - instant.getTime()) / 60000;
}

/**
 * Converts a `datetime-local` input value ("YYYY-MM-DDTHH:mm"), understood
 * as wall-clock time in `timeZone`, into a real UTC ISO instant for storage.
 */
export function localInputToUtcIso(
  localValue: string,
  timeZone: string = BUSINESS_TIMEZONE
): string {
  if (!localValue) return "";

  const [datePart, timePart] = localValue.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = (timePart ?? "00:00").split(":").map(Number);

  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset = offsetMinutesAt(guess, timeZone);

  return new Date(guess.getTime() - offset * 60000).toISOString();
}

/**
 * Converts a stored UTC ISO instant back into a `datetime-local` input
 * value ("YYYY-MM-DDTHH:mm") representing wall-clock time in `timeZone`.
 */
export function isoToLocalInput(
  isoValue: string | null | undefined,
  timeZone: string = BUSINESS_TIMEZONE
): string {
  if (!isoValue) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
    .formatToParts(new Date(isoValue))
    .reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});

  const hour = parts.hour === "24" ? "00" : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`;
}

/** Calendar-day key ("YYYY-MM-DD") of a stored instant, in `timeZone`. */
export function dateKeyInTimeZone(
  isoValue: string,
  timeZone: string = BUSINESS_TIMEZONE
): string {
  return isoToLocalInput(isoValue, timeZone).slice(0, 10);
}

/** Adds calendar months to a "YYYY-MM-DD" key, returning a "YYYY-MM-DD" key. */
export function addMonthsToDateKey(dateKeyValue: string, months: number): string {
  const [year, month, day] = dateKeyValue.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1 + months, day));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Minutes since local midnight of a stored instant, in `timeZone`. */
export function minutesFromMidnightInTimeZone(
  isoValue: string,
  timeZone: string = BUSINESS_TIMEZONE
): number {
  const local = isoToLocalInput(isoValue, timeZone);
  const [, timePart] = local.split("T");
  const [hour, minute] = timePart.split(":").map(Number);
  return hour * 60 + minute;
}

/**
 * Start-of-business-day boundary for a `dateKey` ("YYYY-MM-DD"), as a real
 * UTC instant -- for querying "what falls on this business day" with
 * `.gte(startOfDayUtc(d)).lt(startOfDayUtc(nextDayKey))`.
 */
export function startOfDayUtc(
  dateKeyValue: string,
  timeZone: string = BUSINESS_TIMEZONE
): string {
  return localInputToUtcIso(`${dateKeyValue}T00:00`, timeZone);
}
