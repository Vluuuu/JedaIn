import type { HTMLAttributes, ReactNode } from "react";
import "./ui.css";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "article" | "section" | "div";
  elevated?: boolean;
  children: ReactNode;
}

export function Card({
  as: Component = "div",
  elevated = false,
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <Component
      className={`ui-card ${elevated ? "ui-card--elevated" : ""} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}
