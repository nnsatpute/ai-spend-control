import type { SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const field =
  "w-full rounded-lg border border-mc-line bg-mc-surface px-3.5 py-2.5 text-sm text-mc-ink outline-none transition focus:border-mc-accent focus:ring-4 focus:ring-mc-accent/15";

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${field} ${className}`} {...props} />;
}

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-32 font-mono-mc text-xs leading-relaxed ${field} ${className}`}
      {...props}
    />
  );
}
