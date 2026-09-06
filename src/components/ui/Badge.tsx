import type { HTMLAttributes, ReactNode } from "react";
import "./ui.css";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  showSymbol?: boolean;
  children: ReactNode;
}

const toneSymbols: Record<BadgeTone, string> = {
  neutral: "•",
  info: "i",
  success: "✓",
  warning: "!",
  danger: "×",
};

export function Badge({
  tone = "neutral",
  showSymbol = true,
  children,
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`ui-badge ui-badge--${tone} ${className}`.trim()}
      {...props}
    >
      {showSymbol && (
        <span className="ui-badge__symbol" aria-hidden="true">
          {toneSymbols[tone]}
        </span>
      )}
      {children}
    </span>
  );
}
