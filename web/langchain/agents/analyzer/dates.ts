const TIME_ZONE = "Asia/Jakarta";
const MAX_DATES_PER_GROUP = 5;

const LONG_DATE_FORMAT = new Intl.DateTimeFormat("id-ID", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
// en-CA formats as YYYY-MM-DD, which compares correctly as a string.
const DAY_KEY_FORMAT = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

const MONTHS: Record<string, number> = {
  januari: 1, jan: 1,
  februari: 2, pebruari: 2, feb: 2,
  maret: 3, mar: 3,
  april: 4, apr: 4,
  mei: 5,
  juni: 6, jun: 6,
  juli: 7, jul: 7,
  agustus: 8, agu: 8, agt: 8, ags: 8, aug: 8,
  september: 9, sept: 9, sep: 9,
  oktober: 10, okt: 10, oct: 10,
  november: 11, nov: 11,
  desember: 12, des: 12, dec: 12,
};
const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// "30 Juni 2025", "1 Des. 2026"
const NAMED_DATE_PATTERN = new RegExp(`\\b(\\d{1,2})\\s+(${Object.keys(MONTHS).join("|")})\\.?\\s+(\\d{4})\\b`, "gi");
// "30/06/2025", "30-06-2025" (day first, as written in Indonesia)
const NUMERIC_DATE_PATTERN = /\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/g;

export interface MaterialDates {
  today: string;
  past: string[];
  upcoming: string[];
}

/** Today's date in WIB, e.g. "Rabu, 14 Oktober 2026". */
export function formatToday(now: Date = new Date()): string {
  return LONG_DATE_FORMAT.format(now);
}

function toDayKey(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Finds full dates in the material and splits them into past and upcoming relative to today
 * (WIB). Models judge dates against their training cutoff, so the comparison is done here.
 */
export function classifyMaterialDates(text: string, now: Date = new Date()): MaterialDates {
  const todayKey = DAY_KEY_FORMAT.format(now);
  const found = new Map<string, string>();

  for (const match of text.matchAll(NAMED_DATE_PATTERN)) {
    const month = MONTHS[match[2].toLowerCase()];
    const key = toDayKey(Number(match[3]), month, Number(match[1]));
    if (key && !found.has(key)) {
      found.set(key, `${Number(match[1])} ${MONTH_NAMES[month - 1]} ${match[3]}`);
    }
  }
  for (const match of text.matchAll(NUMERIC_DATE_PATTERN)) {
    const month = Number(match[2]);
    const key = month >= 1 && month <= 12 ? toDayKey(Number(match[3]), month, Number(match[1])) : null;
    if (key && !found.has(key)) {
      found.set(key, `${Number(match[1])} ${MONTH_NAMES[month - 1]} ${match[3]}`);
    }
  }

  const sorted = [...found.entries()].sort(([a], [b]) => a.localeCompare(b));
  return {
    today: formatToday(now),
    past: sorted.filter(([key]) => key < todayKey).map(([, label]) => label).slice(0, MAX_DATES_PER_GROUP),
    upcoming: sorted.filter(([key]) => key >= todayKey).map(([, label]) => label).slice(0, MAX_DATES_PER_GROUP),
  };
}

export function formatDatesForPrompt(dates: MaterialDates): string {
  const lines = [`Hari ini: ${dates.today} (WIB).`];
  if (dates.past.length) {
    lines.push(`Tanggal di materi yang SUDAH LEWAT: ${dates.past.join("; ")}.`);
  }
  if (dates.upcoming.length) {
    lines.push(`Tanggal di materi yang masih akan datang (wajar, bukan tanda bahaya): ${dates.upcoming.join("; ")}.`);
  }
  return lines.join("\n");
}
