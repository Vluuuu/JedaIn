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

  const packages = mockEoPackageStore.getPackagesByEo(eoId);
  const pendingApprovalCount = packages.filter(
    (p) => p.status === "PENDING_ADMIN_REVIEW",
  ).length;

  const sessions = mockEoPackageStore.getSessionsByEo(eoId);
  const activeSessions = sessions.filter((s) => s.status === "OPEN");

  // Bookings from shared transaction store
  const allBookings = mockTransactionStore.getBookings();
  const eoPackageIds = new Set(packages.map((p) => p.packageId));
  const eoBookings = allBookings.filter((b) => eoPackageIds.has(b.packageId));
  const paidBookings = eoBookings.filter(
    (b) => b.status === "PAID" || b.status === "COMPLETED",
  );

  // Reviews for organizer from shared review store using organizerReviewRef
  const eoReviews = mockReviewStore.getReviewsForOrganizer(organizerReviewRef);
  const avgRating =
    eoReviews.length > 0
      ? (
          eoReviews.reduce((sum, r) => sum + r.rating, 0) / eoReviews.length
        ).toFixed(1)
      : undefined;

  const topInsight = mockInsightStore.getAllInsights()[0];

  return (
    <div className="eo-container">
      {/* Top Banner / Quick Action Priority */}
      <header className="eo-page-header">
        <div>
          <Badge tone="success">Operational Workspace</Badge>
          <h1 className="eo-page-title" style={{ marginTop: "var(--space-2)" }}>
            Overview {partner?.businessName ?? "Jeda Alam Nusantara"}
          </h1>
          <p className="eo-page-subtitle">
            Ringkasan performa paket terkurasi, jadwal sesi mendatang, dan
            sinyal kebutuhan traveler.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={() => navigate("/partner/eo/packages/new")}
        >
          + Buat Paket Baru
        </Button>
      </header>

      {/* KPI Priority Grid */}
      <section className="eo-stats-grid" aria-label="Ringkasan operasional EO">
        <div className="eo-stat-card">
          <span className="eo-stat-label">Paket Menunggu Review</span>
          <strong className="eo-stat-value">{pendingApprovalCount}</strong>
          <span className="eo-stat-desc">Ditinjau kurator Admin</span>
        </div>

        <div className="eo-stat-card">
          <span className="eo-stat-label">Sesi Jadwal Aktif</span>
          <strong className="eo-stat-value">{activeSessions.length}</strong>
          <span className="eo-stat-desc">Terbuka untuk pemesanan</span>
        </div>

        <div className="eo-stat-card">
          <span className="eo-stat-label">Total Peserta Terkonfirmasi</span>
          <strong className="eo-stat-value">
            {paidBookings.reduce((sum, b) => sum + b.bookedQuantity, 0)}
          </strong>
          <span className="eo-stat-desc">
            {paidBookings.length} transaksi terbayar
          </span>
        </div>

        <div className="eo-stat-card">
          <span className="eo-stat-label">Rating Kepemanduan</span>
          <strong
            className="eo-stat-value"
            style={{ color: "var(--color-sand-700)" }}
          >
            {avgRating ? `★ ${avgRating}` : "Belum ada rating"}
          </strong>
          <span className="eo-stat-desc">
            {eoReviews.length > 0
              ? `Berdasarkan ${eoReviews.length} ulasan traveler`
              : "Belum ada ulasan masuk"}
          </span>
        </div>
      </section>

      {/* Demand Signal Insight Highlight */}
      {topInsight && (
        <section
          className="eo-banner-card"
          aria-label="Sinyal permintaan traveler"
        >
          <div className="eo-banner-content">
            <Badge tone="info">Sinyal Kebutuhan Tertinggi</Badge>
            <h2 style={{ marginTop: "var(--space-2)" }}>{topInsight.title}</h2>
            <p>{topInsight.unmetDemandDescription}</p>
            <div
              style={{
                display: "flex",
                gap: "var(--space-4)",
                marginTop: "var(--space-3)",
                fontSize: "var(--font-size-body-sm)",
              }}
            >
              <span>
                Wilayah: <strong>{topInsight.targetArea}</strong>
              </span>
              <span>
                Durasi: <strong>{topInsight.durationLabel}</strong>
              </span>
              <span>
                Permintaan:{" "}
                <strong>{topInsight.travelerDemandCount} traveler</strong>
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() =>
              navigate(
                `/partner/eo/packages/new?insightId=${topInsight.insightId}`,
              )
            }
          >
            Buat Paket dari Insight Ini &rarr;
          </Button>
        </section>
      )}

      {/* Upcoming Sessions Table */}
      <section className="eo-section" aria-label="Jadwal sesi terdekat">
        <div className="eo-section-header">
          <div>
            <h2 className="eo-section-title">Jadwal Sesi Mendatang</h2>
            <p
              style={{
                margin: 0,
                fontSize: "var(--font-size-caption)",
                color: "var(--color-text-secondary)",
              }}
            >
              Pantau ketersediaan slot peserta pada paket yang sudah berstatus
              LIVE.
            </p>
          </div>
          <Link
            to="/partner/eo/sessions"
            style={{
              fontSize: "var(--font-size-body-sm)",
              color: "var(--color-brand-primary)",
              fontWeight: 600,
            }}
          >
            Lihat Semua Sesi &rarr;
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-6)",
              color: "var(--color-text-muted)",
            }}
          >
            Belum ada sesi jadwal yang dibuka. Buat paket atau buka sesi pada
            paket LIVE.
          </div>
        ) : (
          <div className="eo-table-wrapper">
            <table className="eo-table">
              <thead>
                <tr>
                  <th>Paket Experience</th>
                  <th>Waktu Keberangkatan</th>
                  <th>Kapasitas</th>
                  <th>Sisa Slot</th>
                  <th>Harga / Orang</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const pkg = packages.find((p) => p.packageId === s.packageId);
                  const dateLabel = new Date(s.startAt).toLocaleDateString(
                    "id-ID",
                    {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  );
                  return (
                    <tr key={s.sessionId}>
                      <td>
                        <strong>{pkg?.title ?? s.packageId}</strong>
                      </td>
                      <td>{dateLabel}</td>
                      <td>{s.capacity} Orang</td>
                      <td>
                        <strong>{s.remainingSlots}</strong> / {s.capacity}
                      </td>
                      <td>Rp{s.pricePerPerson.toLocaleString("id-ID")}</td>
                      <td>
                        <Badge
                          tone={s.status === "OPEN" ? "success" : "neutral"}
                        >
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
