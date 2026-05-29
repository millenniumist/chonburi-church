const TZ = 'Asia/Bangkok';
const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const pad = (n: number): string => String(n).padStart(2, '0');

export type BangkokNow = {
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number;
  /** minutes since midnight, Asia/Bangkok */
  minutes: number;
  /** "HH:MM" */
  time: string;
  /** "YYYY-MM-DD" */
  date: string;
};

/** The current wall-clock in Asia/Bangkok, regardless of the server's TZ. */
export function bangkokNow(at: Date = new Date()): BangkokNow {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(at);

  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';

  const hour = Number(get('hour'));
  const minute = Number(get('minute'));
  const weekday = get('weekday');

  return {
    dayOfWeek: WEEKDAYS[weekday] ?? 0,
    minutes: hour * 60 + minute,
    time: `${pad(hour)}:${pad(minute)}`,
    date: `${get('year')}-${get('month')}-${get('day')}`,
  };
}

/** Convert a "HH:MM" (or "HH:MM:SS") string to minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':');
  return Number(h ?? 0) * 60 + Number(m ?? 0);
}

/** Format a "HH:MM[:SS]" string as "HH:MM" for display. */
export function formatTime(time: string): string {
  const [h, m] = time.split(':');
  return `${pad(Number(h ?? 0))}:${pad(Number(m ?? 0))}`;
}
