import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const iconBaseProps: IconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function CompassTargetIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <polygon points="12 8 15 12 12 16 9 12 12 8" />
    </svg>
  );
}

export function DemandInsightIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M3 20h18" />
      <path d="M7 16V10" />
      <path d="M12 16V6" />
      <path d="M17 16V12" />
    </svg>
  );
}

export function SparklesProductIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M12 3l1.9 4.8L18.7 9.7l-4.8 1.9L12 16.4l-1.9-4.8L5.3 9.7l4.8-1.9L12 3z" />
      <path d="M19 16l.9 2.2L22.1 19l-2.2.9L19 22.1l-.9-2.2L15.9 19l2.2-.9L19 16z" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
