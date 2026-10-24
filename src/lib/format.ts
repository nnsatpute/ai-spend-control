/** Server-side date labels, so client components never format dates themselves (no hydration drift). */
export function formatDateTime(value: Date | null): string | null {
  if (!value) {
    return null;
  }
  return value.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }) + " UTC";
}

export function formatDate(value: Date | null): string | null {
  if (!value) {
    return null;
  }
  return value.toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" });
}
