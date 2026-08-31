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

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
      <path d="M16 3H4a2 2 0 0 0-2 2v2h18V5a2 2 0 0 0-2-2Z" />
      <circle cx="16" cy="14" r="1" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="m12 3 1.9 4.8L18.7 9.7l-4.8 1.9L12 16.4l-1.9-4.8L5.3 9.7l4.8-1.9L12 3z" />
      <path d="M19 16l.9 2.2L22.1 19l-2.2.9L19 22.1l-.9-2.2L15.9 19l2.2-.9L19 16z" />
    </svg>
  );
}
