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
