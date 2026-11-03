const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

// Null is a missing fact; undefined or a nonnumeric formatted value is a bad binding.
export function formatMetric(
  value: string | number | null | undefined,
  format = "text",
): string {
  if (value === null) return "Unknown";
  if (value === undefined) return "Unavailable";
  if (typeof value === "string" && /\$(?:\{|\/)/.test(value)) return "Unavailable";
  if (format === "text") return String(value);
  if (typeof value !== "number" || !Number.isFinite(value)) return "Unavailable";
  const formatted = number.format(value);
  if (format === "sqft") return `${formatted} sqft`;
  return `$${formatted}${format === "usd/month" ? "/mo" : ""}`;
}
