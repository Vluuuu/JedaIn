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
          <span className="home-upcoming-card__date">{summary.tripDate}</span>
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
