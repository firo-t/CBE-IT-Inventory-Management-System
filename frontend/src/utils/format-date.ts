export function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric"
  }).format(new Date(value));
}
