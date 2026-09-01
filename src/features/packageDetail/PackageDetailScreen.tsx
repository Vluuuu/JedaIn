import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Button, Skeleton } from "../../components/ui";
import { QUIZ_DURATION_OPTIONS } from "../quiz/config";
import { formatSessionDateTimeRange } from "./formatSessionDate";
import { defaultPackageDetailAdapter } from "./mockAdapter";
import { PackageHero } from "./PackageHero";
import type {
  PackageDetailAdapter,
  PackageDetailViewModel,
  PersonalizedContext,
} from "./types";
import "./packageDetail.css";

export interface PackageDetailScreenProps {
  adapter?: PackageDetailAdapter;
}

export function PackageDetailScreen({
  adapter = defaultPackageDetailAdapter,
}: PackageDetailScreenProps) {
  const { packageId } = useParams<{ packageId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [viewModel, setViewModel] = useState<PackageDetailViewModel | null>(
    null,
  );

  // Extract optional real recommendation context passed through navigation state
  const navState = location.state as
    { personalizedContext?: PersonalizedContext } | undefined;
  const personalizedContext = navState?.personalizedContext;

  const loadDetail = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await adapter.getPackageDetail(id, { personalizedContext });
      setViewModel(res);
      setIsLoading(false);
    } catch (err: unknown) {
      setIsLoading(false);
      setViewModel({
        state: "ERROR",
        hasOpenSession: false,
        errorMessage:
          err instanceof Error
            ? err.message
            : "Detail experience belum bisa dimuat.",
      });
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!packageId) {
      return;
    }

    adapter
      .getPackageDetail(packageId, { personalizedContext })
      .then((res) => {
        if (!isMounted) return;
        setViewModel(res);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setIsLoading(false);
        setViewModel({
          state: "ERROR",
          hasOpenSession: false,
          errorMessage:
            err instanceof Error
              ? err.message
              : "Detail experience belum bisa dimuat.",
        });
      });

    return () => {
      isMounted = false;
    };
  }, [packageId, adapter, personalizedContext]);

  if (isLoading) {
    return (
      <div className="package-detail-container" aria-busy="true">
        <Skeleton height="18rem" />
        <div className="package-detail-header-card">
          <Skeleton width="40%" height="1.5rem" />
          <Skeleton width="80%" height="2.25rem" />
          <Skeleton width="100%" height="4rem" />
        </div>
        <div className="package-detail-section">
          <Skeleton width="30%" height="1.5rem" />
          <Skeleton width="100%" height="6rem" />
        </div>
      </div>
    );
  }

  if (!viewModel || viewModel.state === "ERROR") {
    return (
      <div className="package-detail-container">
        <div
          className="package-detail-state-box package-detail-state-box--error"
          role="alert"
        >
          <h2>Detail experience belum bisa dimuat.</h2>
          <p>Coba lagi tanpa kehilangan halaman yang sedang kamu buka.</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => packageId && loadDetail(packageId)}
          >
            Coba lagi
          </Button>
        </div>
      </div>
    );
  }

  if (
    viewModel.state === "NOT_FOUND" ||
    !viewModel.package ||
    !viewModel.detail
  ) {
    return (
      <div className="package-detail-container">
        <div className="package-detail-state-box">
          <h2>Experience tidak ditemukan.</h2>
          <p>
            Experience ini mungkin sudah tidak tersedia atau tautannya tidak
            valid.
          </p>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate("/explore")}
          >
            Kembali ke Explore
          </Button>
        </div>
      </div>
    );
  }

  const { package: pkg, detail, hasOpenSession } = viewModel;
  const durationLabel =
    QUIZ_DURATION_OPTIONS.find((d) => d.value === pkg.durationType)?.label ??
    pkg.durationType;

  const formattedPrice = `Rp${pkg.pricePerPerson.toLocaleString("id-ID")}`;

  return (
    <div className="package-detail-container">
      {/* 1. Hero Media */}
      <PackageHero packageData={pkg} />

      {/* Main Content Sections in locked contract order */}
      <div className="package-detail-main">
        {/* 2. Title, Value Proposition & Starting Price */}
        <section
          className="package-detail-header-card"
          aria-labelledby="package-title"
        >
          <div className="package-detail-meta-row">
            <span>{pkg.destinationName}</span>
            <span>•</span>
            <span>{pkg.locationLabel}</span>
            <span>•</span>
            <span>{durationLabel}</span>
          </div>

          <h1 id="package-title" className="package-detail-title">
            {pkg.title}
          </h1>

          <p className="package-detail-value-prop">{detail.valueProposition}</p>

          <div className="package-detail-price-badge">
            <span className="package-detail-price-label">Mulai dari</span>
            <span className="package-detail-price-amount">
              {formattedPrice}
            </span>
            <span className="package-detail-price-unit">/ orang</span>
          </div>
        </section>

        {/* 3. Optional Personalized Match Explanation */}
        {personalizedContext && personalizedContext.reasons.length > 0 && (
          <section
            className="package-detail-personalized-box"
            aria-label={
              personalizedContext.mode === "MATCHED"
                ? "Alasan kecocokan"
                : "Alasan rekomendasi terdekat"
            }
          >
            <h2 className="package-detail-personalized-title">
              {personalizedContext.mode === "MATCHED"
                ? "Kenapa cocok untukmu?"
                : "Kenapa pilihan ini mendekati preferensimu?"}
            </h2>
            <div className="package-detail-personalized-chips">
              {personalizedContext.reasons.slice(0, 3).map((reason, idx) => (
                <span key={idx} className="package-detail-personalized-chip">
                  {reason}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 4. Destination & Location Trust Section */}
        <section
          className="package-detail-section"
          aria-labelledby="dest-trust-heading"
        >
          <h2 id="dest-trust-heading" className="package-detail-section__title">
            Destinasi
          </h2>
          <div className="package-detail-trust-card">
            <div className="package-detail-trust-header">
              <div>
                <h3 className="package-detail-trust-title">
                  {pkg.destinationName}
                </h3>
                <p className="package-detail-trust-subtitle">
                  {pkg.locationLabel}
                </p>
              </div>
              <span className="package-detail-trust-badge">
                {pkg.verificationLevel === "PLUS"
                  ? "Terverifikasi Plus"
                  : "Terverifikasi Dasar"}
              </span>
            </div>
            <p className="package-detail-trust-body">
              {detail.destinationDetail.overviewDescription}
            </p>
            <p className="package-detail-trust-notice">
              Status mitra destinasi berdasarkan proses verifikasi internal
              JedaIn.
            </p>
          </div>
        </section>

        {/* 5. EO / Guide Identity & Status */}
        <section
          className="package-detail-section"
          aria-labelledby="organizer-heading"
        >
          <h2 id="organizer-heading" className="package-detail-section__title">
            Penyelenggara & Pemandu
          </h2>
          <div className="package-detail-trust-card">
            <div className="package-detail-trust-header">
              <div>
                <h3 className="package-detail-trust-title">
                  {detail.organizer.displayName}
                </h3>
                {detail.organizer.roleDescription && (
                  <p className="package-detail-trust-subtitle">
                    {detail.organizer.roleDescription}
                  </p>
                )}
              </div>
              <span className="package-detail-trust-badge">
                {detail.organizer.guideStatus === "CERTIFIED_GUIDE"
                  ? "Status Guide: Certified Guide"
                  : "Status Guide: Concept Organizer"}
              </span>
            </div>
            {detail.organizer.bioSummary && (
              <p className="package-detail-trust-body">
                {detail.organizer.bioSummary}
              </p>
            )}
            <p className="package-detail-trust-notice">
              Penyelenggara terdaftar di JedaIn Partner Portal.
            </p>
          </div>
        </section>

        {/* 6. Experience Highlights */}
        {detail.highlights.length > 0 && (
          <section
            className="package-detail-section"
            aria-labelledby="highlights-heading"
          >
            <h2
              id="highlights-heading"
              className="package-detail-section__title"
            >
              Highlight Pengalaman
            </h2>
            <ul className="package-detail-highlights-list">
              {detail.highlights.map((item, idx) => (
                <li key={idx} className="package-detail-highlight-item">
                  <span
                    className="package-detail-highlight-bullet"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 7. Itinerary */}
        {detail.itinerary.length > 0 && (
          <section
            className="package-detail-section"
            aria-labelledby="itinerary-heading"
          >
            <h2
              id="itinerary-heading"
              className="package-detail-section__title"
            >
              Rencana Perjalanan
            </h2>
            <p className="package-detail-section__desc">
              Garis besar alur kegiatan paket template:
            </p>
            <ol className="package-detail-itinerary-list">
              {detail.itinerary.map((item) => (
                <li key={item.order} className="package-detail-itinerary-item">
                  <span
                    className="package-detail-itinerary-order"
                    aria-hidden="true"
                  >
                    {item.order < 10 ? `0${item.order}` : item.order}
                  </span>
                  <div className="package-detail-itinerary-content">
                    <div className="package-detail-itinerary-header">
                      <h3 className="package-detail-itinerary-title">
                        {item.title}
                      </h3>
                      {item.durationLabel && (
                        <span className="package-detail-itinerary-duration">
                          {item.durationLabel}
                        </span>
                      )}
                    </div>
                    <p className="package-detail-itinerary-desc">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* 8. What's Included / Excluded */}
        <section
          className="package-detail-section"
          aria-labelledby="in-out-heading"
        >
          <h2 id="in-out-heading" className="package-detail-section__title">
            Fasilitas & Ketentuan
          </h2>
          <div className="package-detail-in-out-grid">
            <div className="package-detail-in-out-box package-detail-in-out-box--included">
              <h3 className="package-detail-in-out-title">Sudah Termasuk</h3>
              <ul className="package-detail-in-out-list">
                {detail.includedItems.map((item, idx) => (
                  <li key={idx} className="package-detail-in-out-item">
                    <span aria-hidden="true">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="package-detail-in-out-box package-detail-in-out-box--excluded">
              <h3 className="package-detail-in-out-title">Belum Termasuk</h3>
              <ul className="package-detail-in-out-list">
                {detail.excludedItems.map((item, idx) => (
                  <li key={idx} className="package-detail-in-out-item">
                    <span aria-hidden="true">×</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 9. Safety & Basic Notes */}
        {detail.safetyNotes.length > 0 && (
          <section
            className="package-detail-section"
            aria-labelledby="safety-heading"
          >
            <h2 id="safety-heading" className="package-detail-section__title">
              Catatan Keselamatan & Persiapan
            </h2>
            <ul className="package-detail-simple-list">
              {detail.safetyNotes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </section>
        )}

        {/* 10. Cancellation & Refund Policy Summary */}
        <section
          className="package-detail-section"
          aria-labelledby="policy-heading"
        >
          <h2 id="policy-heading" className="package-detail-section__title">
            Kebijakan Pembatalan & Refund
          </h2>
          <div className="package-detail-policy-box">
            <p>{detail.cancellationPolicySummary}</p>
          </div>
        </section>

        {/* 11. Upcoming Sessions Preview */}
        <section
          className="package-detail-section"
          aria-labelledby="sessions-preview-heading"
        >
          <h2
            id="sessions-preview-heading"
            className="package-detail-section__title"
          >
            Jadwal Terdekat
          </h2>
          {detail.upcomingSessionPreviews.length > 0 ? (
            <div className="package-detail-sessions-list">
              {detail.upcomingSessionPreviews.map((session) => {
                const { dateLabel } = formatSessionDateTimeRange(
                  session.startAt,
                  session.endAt,
                );

                return (
                  <div
                    key={session.sessionId}
                    className="package-detail-session-card"
                  >
                    <div className="package-detail-session-card__header">
                      <div>
                        <span className="package-detail-session-card__date">
                          {dateLabel}
                        </span>
                      </div>
                      <span className="package-detail-session-card__status">
                        {session.status === "OPEN"
                          ? "Tersedia"
                          : session.status === "FULL"
                            ? "Penuh"
                            : "Ditutup"}
                      </span>
                    </div>
                    {session.remainingSlots !== undefined && (
                      <span className="package-detail-session-card__slots">
                        Sisa {session.remainingSlots} slot
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="package-detail-no-session-notice">
              <p>Belum ada jadwal terdekat yang dibuka untuk paket ini.</p>
            </div>
          )}
        </section>

        {/* 12. Reviews Preview */}
        <section
          className="package-detail-section"
          aria-labelledby="reviews-heading"
        >
          <h2 id="reviews-heading" className="package-detail-section__title">
            Ulasan Traveler
          </h2>
          <div className="package-detail-reviews-summary">
            <span>★ {pkg.rating.toFixed(2)} / 5.0</span>
          </div>
          {detail.reviewPreview?.excerpts &&
          detail.reviewPreview.excerpts.length > 0 ? (
            <div className="package-detail-review-excerpt">
              {detail.reviewPreview.excerpts.map((rev) => (
                <div key={rev.bookingId}>
                  <span className="package-detail-review-excerpt__author">
                    {rev.authorName} • {rev.tripDateLabel}
                  </span>
                  <p className="package-detail-review-excerpt__comment">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="package-detail-section__desc">
              Belum ada ulasan tertulis yang ditampilkan.
            </p>
          )}
        </section>
      </div>

      {/* 13. Sticky Progression CTA */}
      <div className="package-detail-sticky-bar">
        <div className="package-detail-sticky-bar__container">
          <div className="package-detail-sticky-bar__price-wrap">
            <span className="package-detail-sticky-bar__price-label">
              Mulai dari
            </span>
            <span className="package-detail-sticky-bar__price">
              {formattedPrice} / orang
            </span>
          </div>

          <div className="package-detail-sticky-bar__action-wrap">
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="package-detail-sticky-bar__cta"
              disabled={!hasOpenSession}
              onClick={() => navigate(`/packages/${pkg.id}/sessions`)}
            >
              Pilih Jadwal
            </Button>
            {!hasOpenSession && (
              <span className="package-detail-sticky-bar__notice">
                Belum ada jadwal tersedia
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
