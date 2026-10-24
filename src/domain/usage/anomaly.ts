/** A day counts as a spike when it is at least twice the recent daily average. */
export const SPIKE_MULTIPLIER = 2;
/** Need a few quiet days before a spike means anything. */
export const MIN_BASELINE_DAYS = 3;

export function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Compares today's usage-based request count with the prior days.
 * Returns null when there is not enough history or the baseline is zero.
 */
export function usageSpike(today: number, priorDays: number[]): { value: number; baseline: number } | null {
  if (priorDays.length < MIN_BASELINE_DAYS) {
    return null;
  }
  const baseline = average(priorDays);
  if (baseline <= 0 || today < baseline * SPIKE_MULTIPLIER) {
    return null;
  }
  return { value: today, baseline };
}
