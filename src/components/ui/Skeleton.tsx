import type { CSSProperties, HTMLAttributes } from "react";
import "./ui.css";

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  radius?: CSSProperties["borderRadius"];
}

export function Skeleton({
  width = "100%",
  height = "1rem",
  radius,
  style,
  className = "",
  ...props
}: SkeletonProps) {
  return (
    <span
      className={`ui-skeleton ${className}`.trim()}
      aria-hidden="true"
      style={{ width, height, borderRadius: radius, ...style }}
      {...props}
    />
  );
}
