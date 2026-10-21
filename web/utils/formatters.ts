// Number formatters based on visual config
export const formatNumber = (value: number, format?: string): string => {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    case 'percentage':
      return new Intl.NumberFormat('id-ID', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 2
      }).format(value / 100);
    case 'decimal':
      return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    default:
      return new Intl.NumberFormat('id-ID').format(value);
  }
};

const RELATIVE_TIME = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });

/** "5 menit yang lalu", "kemarin", "2 bulan yang lalu". */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const diffMinutes = Math.round((new Date(iso).getTime() - now) / 60_000);
  if (Math.abs(diffMinutes) < 60) return RELATIVE_TIME.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return RELATIVE_TIME.format(diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return RELATIVE_TIME.format(diffDays, "day");
  return RELATIVE_TIME.format(Math.round(diffDays / 30), "month");
}

export function formatMediaTypeLabel(mediaType: string): string {
  const normalized = mediaType.toLowerCase();
  if (normalized === "application/pdf") {
    return "PDF";
  }

  if (normalized === "text/markdown" || normalized === "text/md") {
    return "Markdown";
  }

  return mediaType;
}
