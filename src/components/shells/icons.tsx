import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const sharedProps: IconProps = {
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

export function HomeIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />
    </svg>
  );
}

export function ExploreIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5Z" />
    </svg>
  );
}

export function TripsIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M5 7h14v13H5zM9 7V4h6v3M5 11h14" />
    </svg>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function OverviewIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
    </svg>
  );
}

export function InsightsIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M3 20h18" />
      <path d="M6 16v-5" />
      <path d="M12 16V5" />
      <path d="M18 16v-8" />
    </svg>
  );
}

export function PackagesIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M3 7h18v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z" />
      <path d="M3 12h18" />
    </svg>
  );
}

export function SessionsIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function BookingsIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V7Z" />
      <path d="M10 5v14M14 5v14" strokeDasharray="2 2" />
    </svg>
  );
}

export function DestinationsIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M12 21s-7-6.5-7-11.5a7 7 0 0 1 14 0C19 14.5 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

export function ReviewsIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M11 20A7 7 0 0 1 4 13C4 7 11 3 20 3c0 9-4 16-9 17Z" />
      <path d="M4 21c4-4 8-7 16-9" />
    </svg>
  );
}

export function PlayCircleIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
    </svg>
  );
}

// Custom SVG Milestone Medallion Icons
export function MilestoneSproutIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M7 20h10" />
      <path d="M12 20v-8" />
      <path d="M12 12c-3-4-8-3-8-3s1 5 5 5c1 0 2-.4 3-2Z" />
      <path d="M12 9c3-4 8-3 8-3s-1 5-5 5c-1 0-2-.4-3-2Z" />
    </svg>
  );
}

export function MilestoneTrailIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M4 19c4-2 6-8 10-10 2-1 4-1 6-1" />
      <path d="M8 21l2-2" />
      <path d="M12 15l2-2" />
      <path d="M16 11l2-2" />
    </svg>
  );
}

export function MilestoneMapPinIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function MilestoneReflectionStarIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="m12 3 2.5 6.5 6.5 2.5-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
    </svg>
  );
}
