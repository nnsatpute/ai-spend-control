import type { LabelHTMLAttributes } from "react";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className = "", ...props }: LabelProps) {
  return (
    <label
      className={`mb-1.5 block text-xs font-medium tracking-wide text-mc-ink-soft ${className}`}
      {...props}
    />
  );
}
