import { Link } from "react-router";
import { Badge } from "../../components/ui";
import type { VerifiedDestinationItem } from "./types";

export interface DestinationCardProps {
  destination: VerifiedDestinationItem;
}

export function DestinationCard({ destination }: DestinationCardProps) {
  return (
    <Link
      to={`/explore?destination=${encodeURIComponent(destination.destinationName)}`}
      className="home-destination-card"
    >
      <div className="home-destination-card__visual">
        <span className="home-destination-card__badge">
          <Badge tone="success">
            {destination.verificationLevel === "PLUS"
              ? "Terverifikasi Plus"
              : "Terverifikasi Dasar"}
          </Badge>
        </span>
      </div>
      <div className="home-destination-card__body">
        <h3 className="home-destination-card__title">
          {destination.destinationName}
        </h3>
        <p className="home-destination-card__location">
          {destination.locationLabel}
        </p>
      </div>
    </Link>
  );
}
