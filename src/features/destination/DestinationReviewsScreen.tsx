import { Badge } from "../../components/ui";
import { mockReviewStore } from "../reviews/mockReviewStore";
import {
  getDestinationReviewTargetRef,
  resolveAuthenticatedDestinationContext,
} from "./destinationContext";
import "./destination.css";

export function DestinationReviewsScreen() {
  const context = resolveAuthenticatedDestinationContext();
  const destination = context?.destination;

  // Filter ONLY DESTINATION reviews for this venue using centralized target resolver (Exclude EO_GUIDE)
  const reviewTarget = destination
    ? getDestinationReviewTargetRef(destination)
    : "";
  const venueReviews = reviewTarget
    ? mockReviewStore.getReviewsForDestination(reviewTarget)
    : [];

  const avgRating =
    venueReviews.length > 0
      ? (
          venueReviews.reduce((sum, r) => sum + r.rating, 0) /
          venueReviews.length
        ).toFixed(1)
      : undefined;

  return (
    <div className="dest-container">
      <header className="dest-page-header">
        <div>
          <Badge tone="info">Evaluasi Kualitas Kawasan</Badge>
          <h1
            className="dest-page-title"
            style={{ marginTop: "var(--space-2)" }}
          >
            Ulasan & Rating Destinasi
          </h1>
          <p className="dest-page-subtitle">
            Ulasan objektif terpisah dari traveler khusus mengenai keindahan
            alam, ketenangan, kebersihan, dan fasilitas kawasan Anda.
          </p>
        </div>
      </header>

      {/* KPI Stats Grid */}
      <section className="dest-stats-grid">
        <div className="dest-stat-card">
          <span className="dest-stat-label">Rata-rata Rating Kawasan</span>
          <strong
            className="dest-stat-value"
            style={{ color: "var(--color-sand-700)" }}
          >
            {avgRating ? `★ ${avgRating}` : "Belum ada rating"}
          </strong>
          <span className="dest-stat-desc">
            {avgRating ? "Skala 1.0 – 5.0 bintang" : "Belum ada ulasan"}
          </span>
        </div>

        <div className="dest-stat-card">
          <span className="dest-stat-label">Total Ulasan Terverifikasi</span>
          <strong className="dest-stat-value">{venueReviews.length}</strong>
          <span className="dest-stat-desc">Ulasan pengalaman nyata</span>
        </div>
      </section>

      {/* Review List (DP10) */}
      <section className="eo-section" aria-label="Daftar ulasan kawasan">
        <h2 className="eo-section-title">
          Ulasan Pengalaman Traveler di Kawasan
        </h2>

        {venueReviews.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-8)",
              color: "var(--color-text-muted)",
            }}
          >
            <p>Belum ada ulasan destinasi yang tercatat untuk kawasan Anda.</p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            {venueReviews.map((rev) => (
              <article
                key={rev.reviewId}
                style={{
                  padding: "var(--space-4)",
                  background: "var(--color-bg-surface-subtle)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border-default)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--color-sand-700)",
                        fontWeight: "bold",
                      }}
                    >
                      {"★".repeat(rev.rating)}
                      {"☆".repeat(5 - rev.rating)}
                    </span>
                    <strong>{rev.rating} / 5.0</strong>
                  </div>
                  <small style={{ color: "var(--color-text-muted)" }}>
                    {new Date(rev.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </small>
                </div>

                {rev.comment && rev.comment.trim() ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "var(--font-size-body-md)",
                      color: "var(--color-text-primary)",
                      fontStyle: "italic",
                    }}
                  >
                    "{rev.comment}"
                  </p>
                ) : (
                  <span
                    style={{
                      fontSize: "var(--font-size-body-sm)",
                      color: "var(--color-text-muted)",
                      fontStyle: "italic",
                    }}
                  >
                    Tanpa komentar
                  </span>
                )}

                <div
                  style={{
                    fontSize: "var(--font-size-caption)",
                    color: "var(--color-text-secondary)",
                    borderTop: "1px solid var(--color-border-default)",
                    paddingTop: "var(--space-2)",
                    marginTop: "var(--space-1)",
                  }}
                >
                  Nomor Booking: <strong>{rev.bookingId}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
