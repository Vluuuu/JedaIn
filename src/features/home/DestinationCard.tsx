import { Link } from "react-router";
import { Badge } from "../../components/ui";
import { getDestinationVisual } from "../../lib/assets/packageImages";
import type { VerifiedDestinationItem } from "./types";

export interface DestinationCardProps {
  destination: VerifiedDestinationItem;
}

export function DestinationCard({ destination }: DestinationCardProps) {
  const visual = getDestinationVisual(destination.destinationName);

  return (
    <Link
      to={`/explore?destination=${encodeURIComponent(destination.destinationName)}`}
      className="home-destination-card"
    >
      <div
        className="home-destination-card__visual"
        style={{ backgroundImage: `url("${visual.svgDataUri}")` }}
        role="img"
        aria-label={`Ilustrasi destinasi ${destination.destinationName}`}
      >
        <div className="home-destination-card__visual-scrim" />
        <span className="home-destination-card__badge">
          <Badge tone="success">
            {destination.verificationLevel === "PLUS"
              ? "Terverifikasi Plus"
              : "Terverifikasi Dasar"}
          </Badge>
        </span>
      </div>
      <div className="home-destination-card__body">
        <div className="home-destination-card__meta">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{destination.locationLabel}</span>
        </div>
        <h3 className="home-destination-card__title">
          {destination.destinationName}
        </h3>
      </div>
    </Link>
  );
}
