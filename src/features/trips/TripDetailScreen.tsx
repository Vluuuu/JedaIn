import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Badge, Button, Skeleton } from "../../components/ui";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { sessionStore } from "../onboarding/sessionStore";
import { formatSessionDateTimeRange } from "../packageDetail/formatSessionDate";
import { defaultTripsAdapter } from "./mockAdapter";
import type { TripDetailViewModel, TripsAdapter } from "./types";
import "./trips.css";

export interface TripDetailScreenProps {
  adapter?: TripsAdapter;
}

export function TripDetailScreen({
  adapter = defaultTripsAdapter,
}: TripDetailScreenProps) {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<TripDetailViewModel | null>(null);

  const loadData = useCallback(() => {
    if (!bookingId) return;
    adapter
      .getTripDetail(bookingId)
      .then((res) => {
        setIsLoading(false);
        setData(res);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [bookingId, adapter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="trips-container" aria-busy="true">
        <Skeleton width="10rem" height="1.5rem" />
        <Skeleton width="60%" height="2rem" />
        <div style={{ marginTop: "1.5rem" }}>
          <Skeleton height="12rem" />
        </div>
      </div>
    );
  }

  if (!data || !data.booking) {
    return (
      <div className="trips-container">
        <div className="payment-state-box">
          <h2>Trip tidak ditemukan.</h2>
          <p>Detail perjalanan ini tidak tersedia atau tautan tidak valid.</p>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate("/trips")}
          >
            Kembali ke My Trips
          </Button>
        </div>
      </div>
    );
  }

  const {
    booking,
    package: pkg,
    detail,
    session,
    hasDestinationReview,
    hasEoReview,
  } = data;

  const sessionDateLabel =
    session?.startAt && session?.endAt
      ? formatSessionDateTimeRange(session.startAt, session.endAt).dateLabel
      : undefined;

  const isCompleted = booking.status === "COMPLETED";
  const isPaid = booking.status === "PAID";

  const handleSimulateTripCompletion = () => {
    const traveler = sessionStore.get().user;
    if (!traveler || !booking) return;

    const res = mockTransactionStore.completePaidBookingForDemo({
      travelerId: traveler.id,
      bookingId: booking.bookingId,
    });

    if (res.success) {
      loadData();
    }
  };

  return (
    <div className="trips-container">
      {/* 1. Back link */}
      <div className="trip-detail-topbar">
        <Link to="/trips" className="trip-detail-back-btn">
          &larr; Kembali ke My Trips
        </Link>
      </div>

      <header className="trip-detail-header">
        <Badge tone={isCompleted ? "neutral" : "success"}>
          {isCompleted ? "Trip Selesai" : "Trip Terkonfirmasi"}
        </Badge>
        <h1 className="trip-detail-title">{pkg?.title ?? booking.packageId}</h1>
        {pkg?.destinationName && (
          <p className="trip-card__meta">
            {pkg.destinationName} • {pkg.locationLabel}
          </p>
        )}
      </header>

      {/* PROTOTYPE DEMO TRIP COMPLETION SIMULATION */}
      {isPaid && (
        <section
          className="trip-detail-section"
          aria-label="Simulasi penyelesaian trip demo"
          style={{
            border: "1px dashed var(--color-brand-primary)",
            background: "var(--color-bg-surface-subtle)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "var(--space-3)",
            }}
          >
            <div>
              <strong
                style={{
                  display: "block",
                  color: "var(--color-brand-primary)",
                }}
              >
                Prototype Demo: Simulasikan Trip Selesai
              </strong>
              <p
                style={{
                  margin: "0.25rem 0 0",
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Klik untuk memajukan status pesanan menjadi COMPLETED agar dapat
                menguji alur ulasan destinasi & EO.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSimulateTripCompletion}
            >
              Simulasikan Trip Selesai &rarr;
            </Button>
          </div>
        </section>
      )}

      {/* COMPLETED TRIP: Review Section */}
      {isCompleted && (
        <section
          className="trip-detail-section"
          aria-label="Penilaian trip selesai"
        >
          <h2 className="trip-detail-section__title">Penilaian Pengalaman</h2>
          <p className="trips-subtitle" style={{ marginBottom: "1rem" }}>
            Beri penilaian terpisah untuk destinasi dan penyelenggara (EO).
          </p>

          <div className="trip-reviews-grid">
            {/* 1. Destination Review Card */}
            <div className="trip-review-card">
              <div>
                <h3 className="trip-review-card__title">Nilai Destinasi</h3>
                <p className="trip-review-card__desc">
                  Kualitas alam, fasilitas, dan ketenangan tempat.
                </p>
              </div>
              <div>
                {hasDestinationReview ? (
                  <Badge tone="success">Sudah Dinilai ✓</Badge>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      navigate(
                        `/trips/${booking.bookingId}/review?target=destination`,
                      )
                    }
                  >
                    Beri Nilai Destinasi
                  </Button>
                )}
              </div>
            </div>

            {/* 2. EO / Guide Review Card */}
            <div className="trip-review-card">
              <div>
                <h3 className="trip-review-card__title">Nilai EO / Guide</h3>
                <p className="trip-review-card__desc">
                  Pelayanan pendampingan, kejelasan info, dan alur trip.
                </p>
              </div>
              <div>
                {hasEoReview ? (
                  <Badge tone="success">Sudah Dinilai ✓</Badge>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      navigate(`/trips/${booking.bookingId}/review?target=eo`)
                    }
                  >
                    Beri Nilai EO / Guide
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Rincian Pemesanan */}
      <section className="trip-detail-section" aria-label="Rincian pesanan">
        <h2 className="trip-detail-section__title">Informasi Pesanan</h2>
        <div className="trip-detail-row">
          <span>Nomor Pesanan</span>
          <strong>{booking.bookingId}</strong>
        </div>
        {sessionDateLabel && (
          <div className="trip-detail-row">
            <span>Waktu Keberangkatan</span>
            <strong>{sessionDateLabel}</strong>
          </div>
        )}
        <div className="trip-detail-row">
          <span>Jumlah Peserta</span>
          <span>{booking.participantCount} Orang</span>
        </div>
        <div className="trip-detail-row">
          <span>Total Pembayaran</span>
          <strong style={{ color: "var(--color-brand-primary)" }}>
            Rp{booking.totalAmount.toLocaleString("id-ID")}
          </strong>
        </div>
      </section>

      {/* Itinerary & Organizer Details */}
      {detail && (
        <section className="trip-detail-section" aria-label="Rincian itinerary">
          <h2 className="trip-detail-section__title">
            Penyelenggara & Panduan
          </h2>
          <div className="trip-detail-row">
            <span>Penyelenggara (EO)</span>
            <strong>{detail.organizer.displayName}</strong>
          </div>
          {detail.highlights && detail.highlights.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <strong
                style={{
                  fontSize: "0.875rem",
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                Aktivitas Utama:
              </strong>
              <ul
                style={{
                  paddingLeft: "1.25rem",
                  margin: 0,
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                {detail.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Itinerary */}
          {detail.itinerary && detail.itinerary.length > 0 && (
            <div style={{ marginTop: "1.25rem" }}>
              <strong
                style={{
                  fontSize: "0.875rem",
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                Rencana Perjalanan (Itinerary):
              </strong>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {detail.itinerary.map((item) => (
                  <div
                    key={item.order}
                    style={{
                      fontSize: "0.875rem",
                      padding: "0.5rem 0.75rem",
                      backgroundColor: "var(--color-bg-subtle, #f9fafb)",
                      borderRadius: "0.375rem",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {item.title}
                    </div>
                    <p
                      style={{
                        margin: "0.25rem 0 0",
                        color: "var(--color-text-secondary)",
                        fontSize: "0.8125rem",
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Included Items */}
          {detail.includedItems && detail.includedItems.length > 0 && (
            <div style={{ marginTop: "1.25rem" }}>
              <strong
                style={{
                  fontSize: "0.875rem",
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                Termasuk dalam Paket:
              </strong>
              <ul
                style={{
                  paddingLeft: "1.25rem",
                  margin: 0,
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                {detail.includedItems.map((inc, i) => (
                  <li key={i}>{inc}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Cancellation Policy Summary */}
          {detail.cancellationPolicySummary && (
            <div style={{ marginTop: "1.25rem" }}>
              <strong
                style={{
                  fontSize: "0.875rem",
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                Kebijakan Pembatalan:
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                {detail.cancellationPolicySummary}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
