import { Badge } from "../../components/ui";
import { mockReviewStore } from "../reviews/mockReviewStore";
import { partnerSessionStore } from "./partnerSessionStore";
import "./eo.css";

export function EoReviewsScreen() {
  const partner = partnerSessionStore.get();
  const organizerReviewRef = partner?.organizerReviewRef ?? "org_lereng_batu";

  // Filter only EO_GUIDE reviews for this organizer using organizerReviewRef
  const eoReviews = mockReviewStore.getReviewsForOrganizer(organizerReviewRef);

  const avgRating =
    eoReviews.length > 0
      ? (
          eoReviews.reduce((sum, r) => sum + r.rating, 0) / eoReviews.length
        ).toFixed(1)
      : undefined;

  return (
    <div className="eo-container">
      <header className="eo-page-header">
        <div>
          <Badge tone="info">Evaluasi Traveler</Badge>
          <h1 className="eo-page-title" style={{ marginTop: "var(--space-2)" }}>
            Ulasan & Rating Kepemanduan
          </h1>
          <p className="eo-page-subtitle">
            Ulasan objektif terpisah untuk pendampingan, pelayanan, dan
            kejelasan alur trip dari traveler yang telah menyelesaikan
            perjalanan.
          </p>
        </div>
      </header>

      {/* Summary KPI */}
      <section className="eo-stats-grid">
        <div className="eo-stat-card">
          <span className="eo-stat-label">Rata-rata Rating EO</span>
          <strong
            className="eo-stat-value"
            style={{ color: "var(--color-sand-700)" }}
          >
            {avgRating ? `★ ${avgRating}` : "Belum ada rating"}
          </strong>
          <span className="eo-stat-desc">
            {avgRating ? "Skala 1.0 – 5.0 bintang" : "Belum ada ulasan"}
          </span>
        </div>

        <div className="eo-stat-card">
          <span className="eo-stat-label">Total Ulasan Masuk</span>
          <strong className="eo-stat-value">{eoReviews.length}</strong>
          <span className="eo-stat-desc">Ulasan terverifikasi</span>
        </div>
      </section>

      {/* Review List */}
      <section className="eo-section" aria-label="Daftar ulasan traveler">
        <h2 className="eo-section-title">Ulasan Pengalaman Traveler</h2>

        {eoReviews.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-8)",
              color: "var(--color-text-muted)",
            }}
          >
            <p>Belum ada ulasan kepemanduan untuk profil EO Anda.</p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            {eoReviews.map((rev) => (
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
