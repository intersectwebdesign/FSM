/**
 * Datetime-local inputs make it easy to fat-finger the date segment
 * separately from the time segment, producing an end before the start.
 * Drop an end time that isn't strictly after the start rather than
 * persisting invalid data.
 */
export function validScheduledEnd(start: string, end: string): string {
  if (!start || !end) return end;
  return new Date(end) > new Date(start) ? end : "";
}

export function dateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** True for Saturday/Sunday, regardless of the configured week start. */
export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

/** Calendar-week start (0=Sunday..6=Saturday) containing `d`. */
export function startOfWeek(d: Date, weekStartsOn: number): Date {
  const diff = (d.getDay() - weekStartsOn + 7) % 7;
  return addDays(d, -diff);
}

/** Steps a day forward/backward, skipping weekends when `skipWeekends` is set. */
export function stepDay(d: Date, direction: 1 | -1, skipWeekends: boolean): Date {
  let next = addDays(d, direction);
  while (skipWeekends && isWeekend(next)) {
    next = addDays(next, direction);
  }
  return next;
}

/**
 * Assigns overlap "lanes" within a single column so simultaneously
 * scheduled jobs render side-by-side instead of stacking illegibly.
 */
export function layoutOverlaps<T extends { id: string; startMin: number; endMin: number }>(
  items: T[]
): Map<string, { lane: number; laneCount: number }> {
  const sorted = [...items].sort((a, b) => a.startMin - b.startMin);
  const result = new Map<string, { lane: number; laneCount: number }>();

  let clusterItems: (T & { lane: number })[] = [];
  let clusterEnd = -Infinity;
  const laneEnds: number[] = [];

  const flushCluster = () => {
    const laneCount = clusterItems.reduce((max, i) => Math.max(max, i.lane + 1), 0);
    for (const item of clusterItems) {
      result.set(item.id, { lane: item.lane, laneCount });
    }
    clusterItems = [];
    laneEnds.length = 0;
    clusterEnd = -Infinity;
  };

  for (const item of sorted) {
    if (item.startMin >= clusterEnd) {
      flushCluster();
    }

    let lane = laneEnds.findIndex((end) => end <= item.startMin);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.endMin);
    } else {
      laneEnds[lane] = item.endMin;
    }

    clusterItems.push({ ...item, lane });
    clusterEnd = Math.max(clusterEnd, item.endMin);
  }
  flushCluster();

  return result;
}
