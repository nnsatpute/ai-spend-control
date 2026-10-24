import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-mc-signal text-white shadow-[0_6px_20px_-6px_rgba(241,90,58,0.6)] hover:bg-mc-signal-deep active:translate-y-px",
  secondary:
    "border border-mc-ink/70 bg-transparent text-mc-ink hover:bg-mc-ink hover:text-white active:translate-y-px",
  danger:
    "border border-mc-danger/40 bg-mc-surface text-mc-danger hover:bg-mc-danger/10 active:translate-y-px",
  ghost: "text-mc-ink-soft hover:bg-mc-mist hover:text-mc-ink",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 font-display text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
