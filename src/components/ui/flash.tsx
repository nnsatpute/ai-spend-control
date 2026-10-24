export function Flash({
  message,
  error,
}: {
  message?: string | null;
  error?: string | null;
}) {
  if (!message && !error) {
    return null;
  }

  return (
    <div className="space-y-2">
      {message ? (
        <p className="rounded-xl border border-mc-cyan/25 bg-mc-cyan/10 px-4 py-3 text-sm text-mc-cyan">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-mc-danger/25 bg-mc-danger/10 px-4 py-3 text-sm text-mc-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
