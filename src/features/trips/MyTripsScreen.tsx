import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Badge, Button, Skeleton } from "../../components/ui";
import { formatSessionDateTimeRange } from "../packageDetail/formatSessionDate";
import { defaultTripsAdapter } from "./mockAdapter";
import type {
  MyTripsViewModel,
  TripCardItem,
  TripsAdapter,
  TripTab,
} from "./types";
import "./trips.css";

export interface MyTripsScreenProps {
  adapter?: TripsAdapter;
}

export function MyTripsScreen({
  adapter = defaultTripsAdapter,
}: MyTripsScreenProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<MyTripsViewModel | null>(null);
  const [activeTab, setActiveTab] = useState<TripTab>("UPCOMING");

  useEffect(() => {
    let isMounted = true;
    adapter
      .getMyTrips()
      .then((res) => {
        if (!isMounted) return;
        setIsLoading(false);
        setData(res);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [adapter]);

  if (isLoading) {
    return (
      <div className="trips-container" aria-busy="true">
        <Skeleton width="12rem" height="2rem" />
        <div style={{ marginTop: "1.5rem" }}>
          <Skeleton height="8rem" />
        </div>
      </div>
    );
  }

  const { activePendingTrip, upcomingTrips, completedTrips, historyTrips } =
    data ?? {
      upcomingTrips: [],
      completedTrips: [],
      historyTrips: [],
    };

  const currentTabList: TripCardItem[] =
    activeTab === "UPCOMING"
      ? upcomingTrips
      : activeTab === "COMPLETED"
        ? completedTrips
        : historyTrips;

  return (
    <div className="trips-container">
      <header className="trips-header">
        <h1 className="trips-title">My Trips</h1>
        <p className="trips-subtitle">
          Kelola perjalananmu, status pembayaran, dan riwayat trip.
        </p>
      </header>

      {/* Special Pending Payment Section */}
      {activePendingTrip && (
        <section
          className="trips-pending-banner"
          aria-label="Pembayaran tertunda aktif"
        >
          <div className="trips-pending-banner__content">
            <Badge tone="warning">Menunggu Pembayaran</Badge>
            <h2 className="trips-pending-banner__title">
              {activePendingTrip.package?.title ??
                activePendingTrip.booking.packageId}
            </h2>
            <p className="trips-subtitle">
              Total: Rp
              {activePendingTrip.booking.totalAmount.toLocaleString("id-ID")}
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() =>
              navigate(`/payment/${activePendingTrip.booking.bookingId}`)
            }
          >
            Lanjutkan Pembayaran
          </Button>
        </section>
      )}

      {/* Tab Controls */}
      <div className="trips-tabs" role="tablist" aria-label="Kategori trip">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "UPCOMING"}
          className={`trips-tab-btn ${activeTab === "UPCOMING" ? "trips-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("UPCOMING")}
        >
          Upcoming ({upcomingTrips.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "COMPLETED"}
          className={`trips-tab-btn ${activeTab === "COMPLETED" ? "trips-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("COMPLETED")}
        >
          Completed ({completedTrips.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "HISTORY"}
          className={`trips-tab-btn ${activeTab === "HISTORY" ? "trips-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("HISTORY")}
        >
          History ({historyTrips.length})
        </button>
      </div>

      {/* Tab Content List */}
      <div className="trips-list">
        {currentTabList.length === 0 ? (
          <div className="payment-state-box">
            <p>Belum ada trip pada kategori ini.</p>
          </div>
        ) : (
          currentTabList.map((item) => {
            const { booking, package: pkg, session } = item;
            const dateLabel =
              session?.startAt && session?.endAt
                ? formatSessionDateTimeRange(session.startAt, session.endAt)
                    .dateLabel
                : undefined;

            return (
              <article key={booking.bookingId} className="trip-card">
                <div className="trip-card__header">
                  <div>
                    <h2 className="trip-card__title">
                      {pkg?.title ?? booking.packageId}
                    </h2>
                    {pkg?.destinationName && (
                      <p className="trip-card__meta">
                        {pkg.destinationName} • {pkg.locationLabel}
                      </p>
                    )}
                  </div>
                  <Badge
                    tone={
                      booking.status === "PAID"
                        ? "success"
                        : booking.status === "COMPLETED"
                          ? "neutral"
                          : "warning"
                    }
                  >
                    {booking.status === "PAID"
                      ? "Upcoming"
                      : booking.status === "COMPLETED"
                        ? "Completed"
                        : booking.status}
                  </Badge>
                </div>

                <div className="trip-card__details">
                  {dateLabel && <span>Jadwal: {dateLabel}</span>}
                  <span>Peserta: {booking.participantCount} Orang</span>
                  <span>
                    Total: Rp{booking.totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="trip-card__action">
                  {booking.status === "PAID" ||
                  booking.status === "COMPLETED" ? (
                    <Button
                      type="button"
                      variant={
                        booking.status === "PAID" ? "primary" : "secondary"
                      }
                      size="sm"
                      onClick={() => navigate(`/trips/${booking.bookingId}`)}
                    >
                      Lihat Trip
                    </Button>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
