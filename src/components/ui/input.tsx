import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-lg border border-mc-line bg-mc-surface px-3.5 py-2.5 text-sm text-mc-ink outline-none transition placeholder:text-mc-ink-soft/60 focus:border-mc-accent focus:ring-4 focus:ring-mc-accent/15 ${className}`}
      {...props}
    />
  );
}
