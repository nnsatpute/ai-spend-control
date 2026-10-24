export default function AppLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-mc-line border-t-mc-ink"
        aria-hidden
      />
      <p className="text-sm text-mc-ink-soft">Loading…</p>
    </div>
  );
}
