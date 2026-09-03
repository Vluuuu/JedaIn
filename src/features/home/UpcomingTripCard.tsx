import { useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import type { UpcomingTripSummary } from "./types";

export interface UpcomingTripCardProps {
  summary: UpcomingTripSummary;
}

export function UpcomingTripCard({ summary }: UpcomingTripCardProps) {
  const navigate = useNavigate();

  return (
    <section
      className="home-upcoming-card"
      aria-labelledby="upcoming-trip-title"
    >
      <div className="home-upcoming-card__content">
        <div className="home-upcoming-card__header">
          <Badge tone="info">Trip Mendatang</Badge>
          <span className="home-upcoming-card__date">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {summary.tripDate}
          </span>
        </div>
        <h2 id="upcoming-trip-title" className="home-upcoming-card__title">
          {summary.packageName}
        </h2>
        <p className="home-upcoming-card__dest">
          Destinasi: {summary.destinationLabel}
          {summary.meetingOrDepartureSummary &&
            ` • ${summary.meetingOrDepartureSummary}`}
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="md"
        className="home-upcoming-card__cta"
        onClick={() => navigate(`/trips/${summary.bookingId}`)}
      >
        Lihat Trip
      </Button>
    </section>
  );
}
