import { Link, useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { mockReviewStore } from "../reviews/mockReviewStore";
import { mockEoPackageStore } from "./mockEoPackageStore";
import { mockInsightStore } from "./mockInsightStore";
import { partnerSessionStore } from "./partnerSessionStore";
import "./eo.css";

export function EoOverviewScreen() {
  const navigate = useNavigate();
  const partner = partnerSessionStore.get();
  const eoId = partner?.id ?? "eo_jeda_alam";
  const organizerReviewRef = partner?.organizerReviewRef ?? "org_lereng_batu";

  // EO Packages & derived metrics
  const packages = mockEoPackageStore.getPackagesByEo(eoId);
  const livePackages = packages.filter((p) => p.status === "LIVE");
  const pendingPackage = packages.find(
    (p) => p.status === "PENDING_ADMIN_REVIEW",
  );

  // EO Sessions
  const sessions = mockEoPackageStore.getSessionsByEo(eoId);
  const upcomingSessions = sessions.filter((s) => s.status === "OPEN");

  // Bookings strictly isolated to this EO's packages
  const allBookings = mockTransactionStore.getBookings();
  const eoPackageIds = new Set(packages.map((p) => p.packageId));
  const eoBookings = allBookings.filter((b) => eoPackageIds.has(b.packageId));

  // Reviews strictly for this EO's organizer reference
  const eoReviews = mockReviewStore.getReviewsForOrganizer(organizerReviewRef);
  const avgRating =
    eoReviews.length > 0
      ? (
          eoReviews.reduce((sum, r) => sum + r.rating, 0) / eoReviews.length
        ).toFixed(1)
      : undefined;

  // Star insight from aggregate demand engine
  const topInsight = mockInsightStore.getAllInsights()[0];

  // If new EO without packages
  if (packages.length === 0) {
    return (
      <div className="eo-overview-container">
        <header className="eo-overview-header">
          <div className="eo-overview-header__main">
            <h1>
              Overview
              <span className="sr-only">
                {" "}
                {partner?.businessName ?? "Mitra EO"}
              </span>
            </h1>
            <p>
              Orientasi operasional dan sinyal kebutuhan traveler untuk{" "}
              {partner?.businessName ?? "Mitra EO"}.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => navigate("/partner/eo/packages/new")}
          >
            + Buat Paket Baru
          </Button>
        </header>

        <section className="eo-overview-empty-account">
          <h2>Kamu belum punya package.</h2>
          <p>Lihat kebutuhan traveler atau mulai package pertamamu.</p>
          <div className="eo-overview-empty-account__actions">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => navigate("/partner/eo/insights")}
            >
              Lihat Insight
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => navigate("/partner/eo/packages/new")}
            >
              + Buat Paket Baru
            </Button>
          </div>
        </section>
      </div>
    );
  }

  // Preview rows for upcoming sessions (max 3 OPEN sessions, sorted chronologically)
  const sessionPreviewList = [...upcomingSessions]
    .sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    )
    .slice(0, 3);

  // Preview rows for recent booking activity (max 3, sorted by createdAt desc)
  const recentBookings = [...eoBookings]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 3);

  return (
    <div className="eo-overview-container">
      {/* Page Header without redundant badges */}
      <header className="eo-overview-header">
        <div className="eo-overview-header__main">
          <h1>
            Overview
            <span className="sr-only">
              {" "}
              {partner?.businessName ?? "Jeda Alam Nusantara"}
            </span>
          </h1>
          <p>
            Ringkasan performa paket terkurasi, jadwal sesi mendatang, dan
            sinyal kebutuhan traveler.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => navigate("/partner/eo/packages/new")}
        >
          + Buat Paket Baru
        </Button>
      </header>

      {/* 11. KPI Metric Band: Flat surface, clear large metrics, subtle separators */}
      <section
        className="eo-overview-metric-band"
        aria-label="Ringkasan operasional EO"
      >
        <div className="eo-overview-metric-item">
          <span className="eo-overview-metric-label">Live Packages</span>
          <strong className="eo-overview-metric-value">
            {livePackages.length}
          </strong>
          <span className="eo-overview-metric-desc">
            Paket aktif di katalog
          </span>
        </div>

        <div className="eo-overview-metric-item">
          <span className="eo-overview-metric-label">Upcoming Sessions</span>
          <strong className="eo-overview-metric-value">
            {upcomingSessions.length}
          </strong>
          <span className="eo-overview-metric-desc">
            Jadwal keberangkatan mendatang
          </span>
        </div>

        <div className="eo-overview-metric-item">
          <span className="eo-overview-metric-label">Total Bookings</span>
          <strong className="eo-overview-metric-value">
            {eoBookings.length}
          </strong>
          <span className="eo-overview-metric-desc">
            Pesanan pada paket EO ini
          </span>
        </div>

        <div className="eo-overview-metric-item">
          <span className="eo-overview-metric-label">Average Rating</span>
          <strong className="eo-overview-metric-value">
            {avgRating ? `★ ${avgRating}` : "Belum ada rating"}
          </strong>
          <span className="eo-overview-metric-desc">
            {eoReviews.length > 0
              ? `${eoReviews.length} ulasan traveler`
              : "Belum ada ulasan"}
          </span>
        </div>
      </section>

      {/* 12. Pending Approval Callout: Action needed, not KPI */}
      {pendingPackage && (
        <section
          className="eo-overview-attention"
          aria-label="Paket menunggu review admin"
        >
          <div className="eo-overview-attention__content">
            <span className="eo-overview-attention__tag">Menunggu Review</span>
            <div>
              <span className="eo-overview-attention__title">
                {pendingPackage.title}
              </span>{" "}
              <span className="eo-overview-attention__desc">
                - Sedang ditinjau Admin JedaIn.
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              navigate(`/partner/eo/packages/${pendingPackage.packageId}`)
            }
          >
            Lihat Package
          </Button>
        </section>
      )}

      {/* 13 & 14. Demand Opportunity Hero: Intentional Forest dark anchor */}
      {topInsight && (
        <section
          className="eo-overview-demand-hero"
          aria-label="Peluang dari kebutuhan traveler"
        >
          <div className="eo-overview-demand-hero__eyebrow">
            <span>Peluang dari Traveler</span>
            <span className="eo-overview-demand-hero__eyebrow-badge">
              {topInsight.travelerDemandCount} traveler
            </span>
          </div>

          <div className="eo-overview-demand-hero__headline">
            <h2>{topInsight.title}</h2>
            <p>{topInsight.unmetDemandDescription}</p>
          </div>

          <div className="eo-overview-demand-hero__facts">
            <span>
              Area: <strong>{topInsight.targetArea}</strong>
            </span>
            <span>·</span>
            <span>
              Durasi: <strong>{topInsight.durationLabel}</strong>
            </span>
            <span>·</span>
            <span>
              Budget: <strong>{topInsight.preferredBudgetRange}</strong>
            </span>
          </div>

          <div className="eo-overview-demand-hero__actions">
            <Link
              to={`/partner/eo/packages/new?insightId=${topInsight.insightId}`}
              className="eo-overview-demand-hero__cta"
            >
              Buat Paket dari Insight &rarr;
            </Link>
            <Link
              to="/partner/eo/insights"
              className="eo-overview-demand-hero__secondary"
            >
              Lihat Semua Insight
            </Link>
          </div>
        </section>
      )}

      {/* 17. Operations Grid: Balanced 2-column desktop layout */}
      <div className="eo-overview-ops-grid">
        {/* Left: Upcoming Sessions concise operational preview */}
        <section
          className="eo-overview-panel"
          aria-label="Jadwal sesi terdekat"
        >
          <div className="eo-overview-panel__header">
            <div>
              <h2>Jadwal Terdekat</h2>
              <span className="eo-overview-panel__sub">Upcoming Sessions</span>
            </div>
            <Link to="/partner/eo/sessions" className="eo-overview-panel__link">
              Lihat Semua Sesi &rarr;
            </Link>
          </div>

          {sessionPreviewList.length === 0 ? (
            <div className="eo-overview-empty">
              Belum ada jadwal keberangkatan mendatang.
            </div>
          ) : (
            <div className="eo-overview-list">
              {sessionPreviewList.map((s) => {
                const pkg = packages.find((p) => p.packageId === s.packageId);
                const dateLabel = new Date(s.startAt).toLocaleDateString(
                  "id-ID",
                  {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  },
                );
                return (
                  <div key={s.sessionId} className="eo-overview-list-row">
                    <div className="eo-overview-list-row__primary">
                      <span className="eo-overview-list-row__title">
                        {pkg?.title ?? s.packageId}
                      </span>
                      <span className="eo-overview-list-row__meta">
                        {dateLabel} · Rp
                        {s.pricePerPerson.toLocaleString("id-ID")}/orang
                      </span>
                    </div>
                    <div className="eo-overview-list-row__secondary">
                      <span className="eo-overview-list-row__meta">
                        Sisa {s.remainingSlots} dari {s.capacity} slot
                      </span>
                      <Badge tone={s.status === "OPEN" ? "success" : "neutral"}>
                        {s.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: Recent Booking Activity */}
        <section
          className="eo-overview-panel"
          aria-label="Aktivitas booking terbaru"
        >
          <div className="eo-overview-panel__header">
            <div>
              <h2>Pesanan Traveler Terbaru</h2>
              <span className="eo-overview-panel__sub">Recent Bookings</span>
            </div>
            <Link to="/partner/eo/bookings" className="eo-overview-panel__link">
              Lihat Semua Pesanan &rarr;
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="eo-overview-empty">
              Belum ada aktivitas booking.
            </div>
          ) : (
            <div className="eo-overview-list">
              {recentBookings.map((b) => {
                const pkg = packages.find((p) => p.packageId === b.packageId);
                const dateLabel = new Date(b.createdAt).toLocaleDateString(
                  "id-ID",
                  {
                    day: "numeric",
                    month: "short",
                  },
                );
                return (
                  <div key={b.bookingId} className="eo-overview-list-row">
                    <div className="eo-overview-list-row__primary">
                      <span className="eo-overview-list-row__title">
                        {pkg?.title ?? b.packageId}
                      </span>
                      <span className="eo-overview-list-row__meta">
                        {b.participantCount} peserta · Dipesan {dateLabel}
                      </span>
                    </div>
                    <div className="eo-overview-list-row__secondary">
                      <Badge
                        tone={
                          b.status === "PAID" || b.status === "COMPLETED"
                            ? "success"
                            : b.status === "PENDING_PAYMENT"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {b.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
