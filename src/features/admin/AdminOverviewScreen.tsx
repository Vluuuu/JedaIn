import { Link, useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { mockApplicationStore } from "../eo/mockApplicationStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import { mockAdminAuditStore } from "./mockAdminAuditStore";
import { mockComplaintStore } from "./mockComplaintStore";
import { mockDestinationVerificationStore } from "./mockDestinationVerificationStore";
import "./admin.css";

export function AdminOverviewScreen() {
  const navigate = useNavigate();

  // 1. EO applications pending
  const eoApplications = mockApplicationStore.getAll();
  const pendingEoCount = eoApplications.filter(
    (a) => a.status === "PENDING_REVIEW",
  ).length;

  // 2. Destination verifications pending
  const destinationApps = mockDestinationVerificationStore.getAll();
  const pendingDestCount = destinationApps.filter(
    (d) => d.status === "PENDING_REVIEW",
  ).length;

  // 3. Package approvals pending
  const packages = mockEoPackageStore.getAllPackages();
  const pendingPkgCount = packages.filter(
    (p) => p.status === "PENDING_ADMIN_REVIEW",
  ).length;

  // 4. Critical complaints
  const criticalComplaintCount =
    mockComplaintStore.getCriticalUnresolvedCount();

  // Supporting stats from shared stores
  const allSessions = mockEoPackageStore.getAllSessions();
  const openSessionsCount = allSessions.filter(
    (s) => s.status === "OPEN",
  ).length;

  const allBookings = mockTransactionStore.getBookings();
  const paidBookingsCount = allBookings.filter(
    (b) => b.status === "PAID" || b.status === "COMPLETED",
  ).length;

  const recentAudits = mockAdminAuditStore.getAll().slice(0, 5);

  // Highest priority non-empty queue target
  const getPrimaryQueueTarget = () => {
    if (criticalComplaintCount > 0)
      return { path: "/admin/complaints", label: "Periksa Aduan Kritis" };
    if (pendingEoCount > 0)
      return { path: "/admin/eo-approvals", label: "Tinjau Aplikasi EO" };
    if (pendingDestCount > 0)
      return {
        path: "/admin/destination-verifications",
        label: "Verifikasi Destinasi",
      };
    if (pendingPkgCount > 0)
      return { path: "/admin/package-approvals", label: "Kurasi Paket Baru" };
    return { path: "/admin/eo-approvals", label: "Buka Antrean EO" };
  };

  const primaryTarget = getPrimaryQueueTarget();

  return (
    <div className="admin-container">
      <header className="admin-page-header">
        <div>
          <Badge tone="info">Trust & Governance Console</Badge>
          <h1
            className="admin-page-title"
            style={{ marginTop: "var(--space-2)" }}
          >
            Overview Operasional Kurasi & Tata Kelola
          </h1>
          <p className="admin-page-subtitle">
            Pusat peninjauan antrean aplikasi mitra, verifikasi destinasi,
            persetujuan paket, dan audit kepatuhan.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={() => navigate(primaryTarget.path)}
        >
          {primaryTarget.label} &rarr;
        </Button>
      </header>

      {/* Priority Queues Grid (A02 Core) */}
      <section aria-label="Antrean prioritas peninjauan">
        <h2
          style={{
            fontSize: "var(--font-size-heading-sm)",
            marginBottom: "var(--space-3)",
          }}
        >
          Antrean Peninjauan Utama
        </h2>

        <div className="admin-queues-grid">
          <Link to="/admin/eo-approvals" className="admin-queue-card">
            <span className="admin-queue-label">Aplikasi EO Menunggu</span>
            <strong className="admin-queue-value">{pendingEoCount}</strong>
            <span className="admin-queue-desc">
              Pengajuan mitra baru & revisi
            </span>
          </Link>

          <Link
            to="/admin/destination-verifications"
            className="admin-queue-card"
          >
            <span className="admin-queue-label">Verifikasi Destinasi</span>
            <strong className="admin-queue-value">{pendingDestCount}</strong>
            <span className="admin-queue-desc">
              Kesiapan standar & pemandu lokal
            </span>
          </Link>

          <Link to="/admin/package-approvals" className="admin-queue-card">
            <span className="admin-queue-label">Persetujuan Paket</span>
            <strong className="admin-queue-value">{pendingPkgCount}</strong>
            <span className="admin-queue-desc">
              Kurasi mindful itinerary & harga
            </span>
          </Link>

          <Link to="/admin/complaints" className="admin-queue-card">
            <span className="admin-queue-label">Aduan Kritis Aktif</span>
            <strong
              className={`admin-queue-value ${criticalComplaintCount > 0 ? "admin-queue-value--highlight" : ""}`}
            >
              {criticalComplaintCount}
            </strong>
            <span className="admin-queue-desc">
              Memerlukan investigasi tim kurator
            </span>
          </Link>
        </div>
      </section>

      {/* Operational Stats Grid */}
      <section className="admin-section" aria-label="Ringkasan ekosistem">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Aktivitas Ekosistem Terkini</h2>
          <span
            style={{
              fontSize: "var(--font-size-caption)",
              color: "var(--color-text-muted)",
            }}
          >
            Data langsung dari prototype ledger
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          <div
            style={{
              padding: "var(--space-4)",
              background: "var(--color-bg-surface-subtle)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <span className="admin-queue-label">Sesi Aktif Terbuka</span>
            <div
              style={{
                fontSize: "var(--font-size-heading-md)",
                fontWeight: "bold",
                color: "var(--color-brand-primary)",
                margin: "0.25rem 0",
              }}
            >
              {openSessionsCount}
            </div>
            <small style={{ color: "var(--color-text-secondary)" }}>
              Tersedia untuk traveler
            </small>
          </div>

          <div
            style={{
              padding: "var(--space-4)",
              background: "var(--color-bg-surface-subtle)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <span className="admin-queue-label">Transaksi Terbayar</span>
            <div
              style={{
                fontSize: "var(--font-size-heading-md)",
                fontWeight: "bold",
                color: "var(--color-brand-primary)",
                margin: "0.25rem 0",
              }}
            >
              {paidBookingsCount}
            </div>
            <small style={{ color: "var(--color-text-secondary)" }}>
              Terkonfirmasi & selesai
            </small>
          </div>

          <div
            style={{
              padding: "var(--space-4)",
              background: "var(--color-bg-surface-subtle)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <span className="admin-queue-label">Total Log Audit</span>
            <div
              style={{
                fontSize: "var(--font-size-heading-md)",
                fontWeight: "bold",
                color: "var(--color-brand-primary)",
                margin: "0.25rem 0",
              }}
            >
              {mockAdminAuditStore.getAll().length}
            </div>
            <small style={{ color: "var(--color-text-secondary)" }}>
              Aksi manual terekam
            </small>
          </div>
        </div>
      </section>

      {/* Recent Audit Events List */}
      <section className="admin-section" aria-label="Log audit terkini">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Log Audit Keputusan Terkini</h2>
          <Link
            to="/admin/audit"
            style={{
              fontSize: "var(--font-size-body-sm)",
              color: "var(--color-brand-primary)",
              fontWeight: 600,
            }}
          >
            Lihat Semua Audit &rarr;
          </Link>
        </div>

        <div>
          {recentAudits.map((ev) => (
            <div key={ev.auditId} className="admin-audit-row">
              <span className="admin-audit-time">
                {new Date(ev.createdAt).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                WIB
              </span>
              <div>
                <strong>{ev.actionType}</strong> —{" "}
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {ev.entityId}
                </span>
                <p
                  style={{
                    margin: "0.25rem 0 0",
                    fontSize: "var(--font-size-caption)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Catatan: "{ev.reason}"
                </p>
              </div>
              <Badge tone="neutral">{ev.actorLabel}</Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
