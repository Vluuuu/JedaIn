import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button, Skeleton } from "../../components/ui";
import { getPackageVisual } from "../../lib/assets/packageImages";
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
  const [hasError, setHasError] = useState(false);
  const [data, setData] = useState<TripDetailViewModel | null>(null);

  const loadData = useCallback(() => {
    if (!bookingId) return;
    setIsLoading(true);
    setHasError(false);
    adapter
      .getTripDetail(bookingId)
      .then((res) => {
        setIsLoading(false);
        setData(res);
      })
      .catch(() => {
        setIsLoading(false);
        setHasError(true);
      });
  }, [bookingId, adapter]);

  useEffect(() => {
    let isMounted = true;
    if (!bookingId) return;

    adapter
      .getTripDetail(bookingId)
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
  }, [bookingId, adapter]);

  if (isLoading) {
    return (
      <div className="trip-detail-container" aria-busy="true">
        <div className="trip-detail-topbar">
          <Skeleton width="10rem" height="1.5rem" />
        </div>
        <div className="trip-detail-hero-skeleton">
          <Skeleton height="14rem" />
        </div>
        <div className="trip-detail-skeleton-block">
          <Skeleton width="40%" height="1.25rem" />
          <Skeleton width="75%" height="2rem" />
          <Skeleton width="50%" height="1.25rem" />
        </div>
        <div className="trip-detail-skeleton-section">
          <Skeleton height="8rem" />
        </div>
        <div className="trip-detail-skeleton-section">
          <Skeleton height="10rem" />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="trip-detail-container">
        <div className="trip-detail-topbar">
          <Link to="/trips" className="trip-detail-back-btn">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="trip-detail-back-icon"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Kembali ke My Trips</span>
          </Link>
        </div>
        <div
          className="trip-detail-state trip-detail-state--error"
          role="alert"
        >
          <h2 className="trip-detail-state__title">Trip belum bisa dimuat.</h2>
          <p className="trip-detail-state__desc">
            Terjadi kendala saat memuat detail perjalanan. Silakan coba kembali.
          </p>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={loadData}
            className="trip-detail-state__btn"
          >
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  if (!data || !data.booking) {
    return (
      <div className="trip-detail-container">
        <div className="trip-detail-topbar">
          <Link to="/trips" className="trip-detail-back-btn">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="trip-detail-back-icon"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Kembali ke My Trips</span>
          </Link>
        </div>
        <div className="trip-detail-state">
          <h2 className="trip-detail-state__title">Trip tidak ditemukan.</h2>
          <p className="trip-detail-state__desc">
            Detail perjalanan ini tidak tersedia atau tautan tidak valid.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate("/trips")}
            className="trip-detail-state__btn"
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
    organizerContact,
  } = data;

  const sessionDateLabel =
    session?.startAt && session?.endAt
      ? formatSessionDateTimeRange(session.startAt, session.endAt).dateLabel
      : undefined;

  const isCompleted = booking.status === "COMPLETED";
  const isPaid = booking.status === "PAID";

  const visual = getPackageVisual(
    pkg?.id ?? booking.packageId,
    pkg?.destinationName,
  );

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

  // Review Priority: Destination first, then EO/Guide
  const isDestinationMissing = !hasDestinationReview;
  const isEoMissing = !hasEoReview;
  const destinationButtonVariant = isDestinationMissing
    ? "primary"
    : "secondary";
  const eoButtonVariant =
    isEoMissing && !isDestinationMissing ? "primary" : "secondary";

  return (
    <div className="trip-detail-container">
      {/* 1. Back navigation with approved SVG back-arrow */}
      <div className="trip-detail-topbar">
        <Link
          to="/trips"
          className="trip-detail-back-btn"
          aria-label="Kembali ke My Trips"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="trip-detail-back-icon"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Kembali ke My Trips</span>
        </Link>
      </div>

      {/* 2. Hero & Experience Identity */}
      <header className="trip-detail-hero">
        <div
          className="trip-detail-hero__thumb"
          style={{ backgroundImage: `url("${visual.svgDataUri}")` }}
          role="img"
          aria-label={`Ilustrasi ${pkg?.title ?? booking.packageId}`}
        />

        <div className="trip-detail-hero__body">
          <div className="trip-detail-status">
            <span
              className={`trip-detail-status-dot ${
                isCompleted
                  ? "trip-detail-status-dot--completed"
                  : "trip-detail-status-dot--confirmed"
              }`}
              aria-hidden="true"
            />
            <span className="trip-detail-status-text">
              {isCompleted ? "Trip Selesai" : "Trip Terkonfirmasi"}
            </span>
          </div>

          <h1 className="trip-detail-title">
            {pkg?.title ?? booking.packageId}
          </h1>

          {pkg?.destinationName && (
            <p className="trip-detail-meta">
              {pkg.destinationName} • {pkg.locationLabel}
            </p>
          )}

          {sessionDateLabel && (
            <div className="trip-detail-departure-banner">
              <span className="trip-detail-departure-icon" aria-hidden="true">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
              <span className="trip-detail-departure-text">
                {sessionDateLabel}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* 3. Completed Trip Experience: Review Section (T18) */}
      {isCompleted && (
        <section
          className="trip-detail-section trip-detail-section--reviews"
          aria-label="Penilaian pengalaman trip"
        >
          <div className="trip-detail-section__header">
            <h2 className="trip-detail-section__title">Penilaian Pengalaman</h2>
            <p className="trip-detail-section__subtitle">
              Beri penilaian terpisah untuk destinasi dan penyelenggara (EO)
              setelah perjalanan selesai.
            </p>
          </div>

          <div className="trip-detail-reviews-list">
            {/* 1. Destination Review Item */}
            <div className="trip-detail-review-item">
              <div className="trip-detail-review-item__info">
                <div className="trip-detail-review-item__type">Destinasi</div>
                <h3 className="trip-detail-review-item__title">
                  Nilai Destinasi
                </h3>
                <p className="trip-detail-review-item__target">
                  {pkg?.destinationName ?? "Kawasan Destinasi"}
                </p>
                <p className="trip-detail-review-item__desc">
                  Kualitas suasana alam, fasilitas ketenangan, dan kelestarian
                  lingkungan.
                </p>
              </div>

              <div className="trip-detail-review-item__action">
                {hasDestinationReview ? (
                  <span className="trip-detail-reviewed-badge">
                    <span
                      className="trip-detail-reviewed-check"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    <span>Sudah dinilai</span>
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant={destinationButtonVariant}
                    size="md"
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

            {/* 2. EO / Guide Review Item */}
            <div className="trip-detail-review-item">
              <div className="trip-detail-review-item__info">
                <div className="trip-detail-review-item__type">EO / Guide</div>
                <h3 className="trip-detail-review-item__title">
                  Nilai EO / Guide
                </h3>
                <p className="trip-detail-review-item__target">
                  {detail?.organizer.displayName ?? "Penyelenggara Perjalanan"}
                </p>
                <p className="trip-detail-review-item__desc">
                  Pelayanan pendampingan, kejelasan panduan, dan kenyamanan alur
                  trip.
                </p>
              </div>

              <div className="trip-detail-review-item__action">
                {hasEoReview ? (
                  <span className="trip-detail-reviewed-badge">
                    <span
                      className="trip-detail-reviewed-check"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    <span>Sudah dinilai</span>
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant={eoButtonVariant}
                    size="md"
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

      {/* 4. Trip Essentials */}
      <section
        className="trip-detail-section"
        aria-label="Informasi pesanan dan trip"
      >
        <h2 className="trip-detail-section__title">Informasi Trip</h2>
        <div className="trip-detail-facts-grid">
          <div className="trip-detail-fact">
            <span className="trip-detail-fact__label">Nomor Pesanan</span>
            <strong className="trip-detail-fact__value trip-detail-fact__value--break">
              {booking.bookingId}
            </strong>
          </div>

          {sessionDateLabel && (
            <div className="trip-detail-fact">
              <span className="trip-detail-fact__label">
                Jadwal Keberangkatan
              </span>
              <strong className="trip-detail-fact__value">
                {sessionDateLabel}
              </strong>
            </div>
          )}

          <div className="trip-detail-fact">
            <span className="trip-detail-fact__label">Jumlah Peserta</span>
            <span className="trip-detail-fact__value">
              {booking.participantCount} Orang
            </span>
          </div>

          <div className="trip-detail-fact">
            <span className="trip-detail-fact__label">Status Pesanan</span>
            <span className="trip-detail-fact__value">
              {isCompleted ? "Selesai" : "Terkonfirmasi"}
            </span>
          </div>

          <div className="trip-detail-fact">
            <span className="trip-detail-fact__label">Total Pembayaran</span>
            <span className="trip-detail-fact__value trip-detail-fact__value--price">
              Rp{booking.totalAmount.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </section>

      {/* 5. Post-Purchase EO Contact & Organizer Profile */}
      {detail && (
        <section
          className="trip-detail-section"
          aria-label="Penyelenggara dan kontak trip"
        >
          <h2 className="trip-detail-section__title">
            Penyelenggara & Kontak Trip
          </h2>

          <div className="trip-detail-organizer-block">
            <div className="trip-detail-organizer-header">
              <div className="trip-detail-organizer-title-wrap">
                <h3 className="trip-detail-organizer-name">
                  {detail.organizer.displayName}
                </h3>
                {detail.organizer.roleDescription && (
                  <p className="trip-detail-organizer-role">
                    {detail.organizer.roleDescription}
                  </p>
                )}
              </div>

              {detail.organizer.guideStatus === "CERTIFIED_GUIDE" && (
                <div className="trip-detail-certified-inline">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="trip-detail-certified-icon"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Pemandu tersertifikasi</span>
                </div>
              )}
            </div>

            {detail.organizer.bioSummary && (
              <p className="trip-detail-organizer-bio">
                {detail.organizer.bioSummary}
              </p>
            )}

            {/* Source-backed EO Contact Information (Post-Purchase Only) */}
            {organizerContact && (
              <div className="trip-detail-contact-card">
                <div className="trip-detail-contact-card__body">
                  <div className="trip-detail-contact-person">
                    <span className="trip-detail-contact-person__label">
                      Penanggung Jawab EO
                    </span>
                    <strong className="trip-detail-contact-person__name">
                      {organizerContact.contactPerson}
                    </strong>
                  </div>

                  <div className="trip-detail-contact-methods">
                    {organizerContact.phone && (
                      <div className="trip-detail-contact-method-row">
                        <span className="trip-detail-contact-method-icon">
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                        </span>
                        <span className="trip-detail-contact-method-val">
                          {organizerContact.phone}
                        </span>
                      </div>
                    )}

                    {organizerContact.email && (
                      <div className="trip-detail-contact-method-row">
                        <span className="trip-detail-contact-method-icon">
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                        </span>
                        <a
                          href={`mailto:${organizerContact.email}`}
                          className="trip-detail-contact-email-link"
                        >
                          {organizerContact.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {organizerContact.phone && (
                  <div className="trip-detail-contact-card__action">
                    <a
                      href={`tel:${organizerContact.phone}`}
                      className="ui-button ui-button--secondary ui-button--md trip-detail-contact-cta"
                    >
                      Hubungi EO
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 6. Highlights */}
      {detail?.highlights && detail.highlights.length > 0 && (
        <section className="trip-detail-section" aria-label="Aktivitas utama">
          <h2 className="trip-detail-section__title">Aktivitas Utama</h2>
          <ul className="trip-detail-list">
            {detail.highlights.map((highlight, idx) => (
              <li key={idx} className="trip-detail-list-item">
                <span className="trip-detail-list-icon" aria-hidden="true">
                  •
                </span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 7. Itinerary Timeline */}
      {detail?.itinerary && detail.itinerary.length > 0 && (
        <section
          className="trip-detail-section"
          aria-label="Rencana perjalanan itinerary"
        >
          <h2 className="trip-detail-section__title">
            Rencana Perjalanan (Itinerary)
          </h2>
          <div className="trip-detail-timeline">
            {detail.itinerary.map((item) => (
              <div key={item.order} className="trip-detail-timeline-item">
                <div
                  className="trip-detail-timeline-marker"
                  aria-hidden="true"
                />
                <div className="trip-detail-timeline-content">
                  {(item.timeOfDayLabel || item.durationLabel) && (
                    <div className="trip-detail-timeline-tag">
                      {item.timeOfDayLabel && (
                        <span>{item.timeOfDayLabel}</span>
                      )}
                      {item.timeOfDayLabel && item.durationLabel && (
                        <span aria-hidden="true"> • </span>
                      )}
                      {item.durationLabel && <span>{item.durationLabel}</span>}
                    </div>
                  )}
                  <h3 className="trip-detail-timeline-title">{item.title}</h3>
                  <p className="trip-detail-timeline-desc">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. Inclusions & Exclusions */}
      {detail && (
        <section
          className="trip-detail-section"
          aria-label="Kelengkapan paket perjalanan"
        >
          <div className="trip-detail-in-out-grid">
            {detail.includedItems && detail.includedItems.length > 0 && (
              <div className="trip-detail-in-out-block">
                <h2 className="trip-detail-section__title">
                  Termasuk dalam Paket
                </h2>
                <ul className="trip-detail-list">
                  {detail.includedItems.map((inc, i) => (
                    <li key={i} className="trip-detail-list-item">
                      <span
                        className="trip-detail-list-icon trip-detail-list-icon--check"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detail.excludedItems && detail.excludedItems.length > 0 && (
              <div className="trip-detail-in-out-block">
                <h2 className="trip-detail-section__title">Tidak Termasuk</h2>
                <ul className="trip-detail-list">
                  {detail.excludedItems.map((exc, i) => (
                    <li key={i} className="trip-detail-list-item">
                      <span
                        className="trip-detail-list-icon trip-detail-list-icon--cross"
                        aria-hidden="true"
                      >
                        ✕
                      </span>
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 9. Safety Notes / Sebelum Berangkat */}
      {detail?.safetyNotes && detail.safetyNotes.length > 0 && (
        <section
          className="trip-detail-section"
          aria-label="Catatan persiapan sebelum berangkat"
        >
          <h2 className="trip-detail-section__title">Sebelum Berangkat</h2>
          <ul className="trip-detail-list">
            {detail.safetyNotes.map((note, i) => (
              <li key={i} className="trip-detail-list-item">
                <span className="trip-detail-list-icon" aria-hidden="true">
                  •
                </span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 10. Cancellation Policy */}
      {detail?.cancellationPolicySummary && (
        <section
          className="trip-detail-section"
          aria-label="Kebijakan pembatalan"
        >
          <h2 className="trip-detail-section__title">Kebijakan Pembatalan</h2>
          <p className="trip-detail-policy-text">
            {detail.cancellationPolicySummary}
          </p>
        </section>
      )}

      {/* 11. Discreet Prototype Demo Trip Completion Disclosure (PAID Only) */}
      {isPaid && (
        <details
          className="trip-detail-demo-disclosure"
          aria-label="Simulasi penyelesaian trip demo"
        >
          <summary className="trip-detail-demo-summary">
            <span>Kontrol Demo</span>
          </summary>
          <div className="trip-detail-demo-body">
            <p className="trip-detail-demo-desc">
              Klik tombol di bawah untuk memajukan status pesanan menjadi
              COMPLETED agar dapat menguji alur ulasan destinasi dan EO.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSimulateTripCompletion}
              className="trip-detail-demo-btn"
            >
              Simulasikan Trip Selesai
            </Button>
          </div>
        </details>
      )}
    </div>
  );
}
