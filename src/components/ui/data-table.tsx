import type { ReactNode } from "react";

type DataTableProps = {
  headers: string[];
  children: ReactNode;
  empty?: boolean;
  emptyMessage?: string;
  colSpan?: number;
};

export function DataTable({
  headers,
  children,
  empty = false,
  emptyMessage = "Nothing here yet.",
  colSpan,
}: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-y border-mc-line bg-mc-elevated">
            {headers.map((header) => (
              <th
                key={header}
                className="px-6 py-3 text-xs font-semibold tracking-wide text-mc-ink-soft uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr>
              <td
                className="px-6 py-12 text-center text-sm text-mc-ink-soft"
                colSpan={colSpan ?? headers.length}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function DataRow({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-mc-line/70 transition last:border-b-0 hover:bg-mc-elevated/60">
      {children}
    </tr>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "ok" | "warn" | "bad" | "neutral";
}) {
  const tones = {
    ok: "bg-mc-cyan/12 text-mc-cyan",
    warn: "bg-mc-warn/12 text-mc-warn",
    bad: "bg-mc-danger/12 text-mc-danger",
    neutral: "bg-mc-mist text-mc-ink-soft",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
