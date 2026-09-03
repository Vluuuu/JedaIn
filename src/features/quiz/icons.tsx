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

// Nav / General Icons
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

// Q1 Intent Icons
export function RechargeIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

export function NatureLeafIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M11 20A7 7 0 0 1 4 13C4 6 11 3 20 3c0 9-3 16-10 16z" />
      <path d="M4 20l7-7" />
    </svg>
  );
}

export function NoveltyCompassIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

export function ReflectionMoonIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      <path d="M19 3v4M21 5h-4" />
    </svg>
  );
}

export function ActiveHikingIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="m4 15 4-4 4 4 4-4 4 4" />
      <path d="M4 9l4-4 4 4 4-4 4 4" />
      <circle cx="12" cy="4" r="1" />
    </svg>
  );
}

export function SocialHeartIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

// Q2 Activity Icons
export function SceneryMountainIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}

export function LotusMindfulnessIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M12 3c-2 3-3 6-3 9a3 3 0 0 0 6 0c0-3-1-6-3-9z" />
      <path d="M12 12c-3-2-6-3-9-3a3 3 0 0 0 0 6c3 0 6-1 9-3z" />
      <path d="M12 12c3-2 6-3 9-3a3 3 0 0 1 0 6c-3 0-6-1-9-3z" />
    </svg>
  );
}

export function CultureTempleIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M4 21h16M4 17h16M6 17v-4M10 17v-4M14 17v-4M18 17v-4M2 13h20M12 3l8 6H4l8-6z" />
    </svg>
  );
}

export function CreativeBrushIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="m14 12 6-6a2 2 0 0 0-2.8-2.8l-6 6" />
      <path d="M9 13.5A4.5 4.5 0 1 0 4 19c1.5 0 3-.5 4-1.5l1-4z" />
    </svg>
  );
}

export function ExplorationMapIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" x2="9" y1="3" y2="18" />
      <line x1="15" x2="15" y1="6" y2="21" />
    </svg>
  );
}

export function OutdoorSunIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

// Q3 Budget Icons
export function WalletTier1Icon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <circle cx="16" cy="14" r="1.5" />
    </svg>
  );
}

export function WalletTier2Icon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
      <path d="M16 3H4a2 2 0 0 0-2 2v2h18V5a2 2 0 0 0-2-2Z" />
      <circle cx="16" cy="14" r="1.5" />
    </svg>
  );
}

export function WalletTier3Icon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 12h12M12 8v8" />
    </svg>
  );
}

export function WalletTier4Icon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

// Q4 Duration Icons
export function ClockHalfDayIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
      <path
        d="M12 2a10 10 0 0 1 0 20Z"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
  );
}

export function SunFullDayIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M5.64 18.36l-2.12 2.12M18.36 5.64l2.12-2.12" />
    </svg>
  );
}

export function MoonCampIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      <polygon points="4 21 9 12 14 21 4 21" />
      <polygon points="11 21 16 14 21 21 11 21" />
    </svg>
  );
}

export function JourneyCalendarIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
    </svg>
  );
}

// Q5 Departure Icons
export function MapPinCityIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function OtherLocationIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

// Q6 Group Context Icons
export function SoloUserIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function PartnerUsersIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function FriendsGroupIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <circle cx="19" cy="11" r="2" />
    </svg>
  );
}

export function FamilyHomeIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function UsersSizeIcon(props: IconProps) {
  return (
    <svg {...iconBaseProps} {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
