import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Skeleton } from "../../components/ui";
import { getPackageVisual } from "../../lib/assets/packageImages";
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
  const [hasError, setHasError] = useState(false);
  const [data, setData] = useState<MyTripsViewModel | null>(null);
  const [activeTab, setActiveTab] = useState<TripTab>("UPCOMING");

  const loadData = useCallback(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);
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
        setHasError(true);
      });
    return () => {
      isMounted = false;
    };
  }, [adapter]);

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
        setHasError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [adapter]);

  if (isLoading) {
    return (
      <div className="my-trips-container" aria-busy="true">
        <header className="my-trips-header">
          <Skeleton width="12rem" height="2.25rem" />
          <div className="my-trips-skeleton-subtitle">
            <Skeleton width="18rem" height="1.25rem" />
          </div>
        </header>
        <div className="my-trips-tabs-skeleton">
          <Skeleton width="100%" height="2.75rem" />
        </div>
        <div className="my-trips-list">
          <div className="my-trip-card my-trip-card--skeleton">
            <Skeleton height="10rem" />
            <div className="my-trip-card__skeleton-body">
              <Skeleton width="60%" height="1.5rem" />
              <Skeleton width="40%" height="1rem" />
              <Skeleton width="80%" height="1rem" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="my-trips-container">
        <header className="my-trips-header">
          <h1 className="my-trips-title">My Trips</h1>
          <p className="my-trips-subtitle">
            Kelola perjalananmu, status pembayaran, dan riwayat trip.
          </p>
        </header>
        <div className="my-trips-error-state" role="alert">
          <div className="my-trips-error-state__content">
            <h2 className="my-trips-error-state__title">
              Trip belum bisa dimuat.
            </h2>
            <p className="my-trips-error-state__desc">
              Terjadi kendala saat memuat data perjalanan. Silakan coba kembali.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={loadData}
            className="my-trips-retry-btn"
          >
            Coba Lagi
          </Button>
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
    <div className="my-trips-container">
      <header className="my-trips-header">
        <h1 className="my-trips-title">My Trips</h1>
        <p className="my-trips-subtitle">
          Kelola perjalananmu, status pembayaran, dan riwayat trip.
        </p>
      </header>

      {/* Special Pending Payment Section (Outside Tabs) */}
      {activePendingTrip && (
        <section
          className="my-trips-pending-card"
          aria-label="Pembayaran tertunda aktif"
        >
          {(() => {
            const visual = getPackageVisual(
              activePendingTrip.package?.id ??
                activePendingTrip.booking.packageId,
              activePendingTrip.package?.destinationName,
            );
            return (
              <div
                className="my-trips-pending-card__thumb"
                style={{ backgroundImage: `url("${visual.svgDataUri}")` }}
                role="img"
                aria-label={`Ilustrasi ${activePendingTrip.package?.title ?? activePendingTrip.booking.packageId}`}
              />
            );
          })()}

          <div className="my-trips-pending-card__body">
            <div className="my-trips-status my-trips-status--pending">
              <span
                className="my-trips-status-dot my-trips-status-dot--pending"
                aria-hidden="true"
              />
              <span className="my-trips-status-text">Menunggu Pembayaran</span>
            </div>

            <div className="my-trips-pending-card__info">
              <h2 className="my-trips-pending-card__title">
                {activePendingTrip.package?.title ??
                  activePendingTrip.booking.packageId}
              </h2>
              {activePendingTrip.package?.destinationName && (
                <p className="my-trips-pending-card__meta">
                  {activePendingTrip.package.destinationName} •{" "}
                  {activePendingTrip.package.locationLabel}
                </p>
              )}
            </div>

            <div className="my-trips-pending-card__footer">
              <div className="my-trips-pending-card__amount-wrap">
                <span className="my-trips-pending-card__amount-label">
                  Total Pembayaran
                </span>
                <strong className="my-trips-pending-card__amount-value">
                  Rp
                  {activePendingTrip.booking.totalAmount.toLocaleString(
                    "id-ID",
                  )}
                </strong>
              </div>

              <Button
                type="button"
                variant="primary"
                size="md"
                className="my-trips-pending-card__cta"
                onClick={() =>
                  navigate(`/payment/${activePendingTrip.booking.bookingId}`)
                }
              >
                Lanjutkan Pembayaran
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Tab Controls */}
      <div className="my-trips-tabs" role="tablist" aria-label="Kategori trip">
        <button
          type="button"
          role="tab"
          id="tab-upcoming"
          aria-selected={activeTab === "UPCOMING"}
          aria-controls="panel-trips-list"
          className={`my-trips-tab-btn ${activeTab === "UPCOMING" ? "my-trips-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("UPCOMING")}
        >
          Upcoming ({upcomingTrips.length})
        </button>
        <button
          type="button"
          role="tab"
          id="tab-completed"
          aria-selected={activeTab === "COMPLETED"}
          aria-controls="panel-trips-list"
          className={`my-trips-tab-btn ${activeTab === "COMPLETED" ? "my-trips-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("COMPLETED")}
        >
          Completed ({completedTrips.length})
        </button>
        <button
          type="button"
          role="tab"
          id="tab-history"
          aria-selected={activeTab === "HISTORY"}
          aria-controls="panel-trips-list"
          className={`my-trips-tab-btn ${activeTab === "HISTORY" ? "my-trips-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("HISTORY")}
        >
          History ({historyTrips.length})
        </button>
      </div>

      {/* Tab Content List */}
      <div
        id="panel-trips-list"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab.toLowerCase()}`}
        className="my-trips-list"
      >
        {currentTabList.length === 0 ? (
          <div className="my-trips-empty-state">
            <h2 className="my-trips-empty-state__title">
              {activeTab === "UPCOMING"
                ? "Belum ada trip mendatang."
                : activeTab === "COMPLETED"
                  ? "Belum ada trip yang selesai."
                  : "Belum ada riwayat trip."}
            </h2>
            {activeTab === "UPCOMING" && (
              <div className="my-trips-empty-state__action">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => navigate("/explore")}
                >
                  Jelajahi Experience
                </Button>
              </div>
            )}
          </div>
        ) : (
          currentTabList.map((item) => {
            const { booking, package: pkg, session } = item;
            const dateRange =
              session?.startAt && session?.endAt
                ? formatSessionDateTimeRange(session.startAt, session.endAt)
                : undefined;

            const visual = getPackageVisual(
              pkg?.id ?? booking.packageId,
              pkg?.destinationName,
            );

            const isUpcoming = booking.status === "PAID";
            const isCompleted = booking.status === "COMPLETED";
            const isCancelled = booking.status === "CANCELLED";

            const statusDotModifier = isUpcoming
              ? "my-trips-status-dot--upcoming"
              : isCompleted
                ? "my-trips-status-dot--completed"
                : "my-trips-status-dot--history";

            const statusLabel = isUpcoming
              ? "Upcoming"
              : isCompleted
                ? "Completed"
                : isCancelled
                  ? "Dibatalkan"
                  : "Kedaluwarsa";

            return (
              <article key={booking.bookingId} className="my-trip-card">
                <div
                  className="my-trip-card__thumb"
                  style={{ backgroundImage: `url("${visual.svgDataUri}")` }}
                  role="img"
                  aria-label={`Ilustrasi ${pkg?.title ?? booking.packageId}`}
                />

                <div className="my-trip-card__body">
                  <div className="my-trip-card__header">
                    <div className="my-trips-status">
                      <span
                        className={`my-trips-status-dot ${statusDotModifier}`}
                        aria-hidden="true"
                      />
                      <span className="my-trips-status-text">
                        {statusLabel}
                      </span>
                    </div>

                    <h2 className="my-trip-card__title">
                      {pkg?.title ?? booking.packageId}
                    </h2>

                    {pkg?.destinationName && (
                      <p className="my-trip-card__meta">
                        {pkg.destinationName} • {pkg.locationLabel}
                      </p>
                    )}
                  </div>

                  <div className="my-trip-card__facts">
                    {dateRange && (
                      <div className="my-trip-card__fact-item">
                        <span
                          className="my-trip-card__fact-icon"
                          aria-hidden="true"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="3"
                              y="4"
                              width="18"
                              height="18"
                              rx="2"
                              ry="2"
                            />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </span>
                        <span className="my-trip-card__fact-text">
                          {dateRange.dateLabel}
                        </span>
                      </div>
                    )}

                    <div className="my-trip-card__fact-meta">
                      <span>{booking.participantCount} peserta</span>
                      <span
                        className="my-trip-card__bullet-separator"
                        aria-hidden="true"
                      >
                        •
                      </span>
                      <span>
                        Rp{booking.totalAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {(isUpcoming || isCompleted) && (
                    <div className="my-trip-card__action">
                      <Button
                        type="button"
                        variant={isUpcoming ? "primary" : "secondary"}
                        size="md"
                        onClick={() => navigate(`/trips/${booking.bookingId}`)}
                      >
                        {isUpcoming ? "Lihat Trip" : "Lihat Detail"}
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
