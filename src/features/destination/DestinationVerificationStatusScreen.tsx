import { Link, useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import "./destination.css";

export function DestinationVerificationStatusScreen() {
  const navigate = useNavigate();
  const partner = partnerSessionStore.get();
  const app = partner
    ? mockDestinationVerificationStore.getByPartnerId(partner.id)
    : undefined;

  const handleOpenDashboard = () => {
    navigate("/partner/destination");
  };

  const handleSwitchToApprovedDemo = () => {
    partnerSessionStore.loginAsDemoDestination();
    navigate("/partner/destination");
  };

  const handleReapply = () => {
    navigate("/partner/apply/destination");
  };

  // Case 0: No application submitted yet for this authenticated Destination partner
  if (!app) {
    return (
      <div
        className="dest-container"
        style={{ padding: "var(--space-8) var(--space-4)", maxWidth: "680px" }}
      >
        <header className="dest-page-header">
          <div>
            <Badge tone="neutral">Belum Ada Pengajuan</Badge>
            <h1
              className="dest-page-title"
              style={{ marginTop: "var(--space-2)" }}
            >
              Status Verifikasi Destinasi
            </h1>
            <p className="dest-page-subtitle">
              Akun Mitra:{" "}
              <strong>{partner?.businessName ?? "Destinasi Baru"}</strong>
            </p>
          </div>
        </header>

        <section className="eo-section" style={{ gap: "var(--space-4)" }}>
          <div className="admin-alert admin-alert--info">
            <h2
              style={{
                fontSize: "var(--font-size-heading-sm)",
                margin: "0 0 var(--space-1)",
              }}
            >
              Belum Ada Formulir Pengajuan Verifikasi
            </h2>
            <p style={{ margin: 0 }}>
              Anda belum mengirimkan formulir verifikasi kawasan destinasi.
              Silakan isi formulir kurasi agar lokasi Anda dapat diverifikasi
              oleh Tim Admin JedaIn.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Link
              to="/partner"
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "var(--font-size-body-sm)",
              }}
            >
              &larr; Kembali ke Portal Partner
            </Link>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => navigate("/partner/apply/destination")}
            >
              Mulai Pengajuan Verifikasi &rarr;
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const status = app.status;

  return (
    <div
      className="dest-container"
      style={{ padding: "var(--space-8) var(--space-4)", maxWidth: "680px" }}
    >
      <header className="dest-page-header">
        <div>
          <Badge
            tone={
              status === "APPROVED"
                ? "success"
                : status === "REJECTED"
                  ? "danger"
                  : "warning"
            }
          >
            {status === "APPROVED"
              ? "Destinasi Terverifikasi"
              : status === "REJECTED"
                ? "Perlu Perbaikan"
                : "Menunggu Verifikasi Admin"}
          </Badge>
          <h1
            className="dest-page-title"
            style={{ marginTop: "var(--space-2)" }}
          >
            Status Verifikasi Destinasi
          </h1>
          <p className="dest-page-subtitle">
            Kawasan: <strong>{app.name}</strong> ({app.locationLabel})
          </p>
        </div>
      </header>

      {/* APPROVED STATE */}
      {status === "APPROVED" && (
        <section className="eo-section" style={{ gap: "var(--space-4)" }}>
          <div className="admin-alert admin-alert--success">
            <h2
              style={{
                fontSize: "var(--font-size-heading-sm)",
                margin: "0 0 var(--space-1)",
              }}
            >
              Selamat! Destinasi Anda Telah Terverifikasi JedaIn
            </h2>
            <p style={{ margin: "0 0 var(--space-2)" }}>
              Lokasi Anda telah disetujui sebagai destinasi terkurasi dengan
              status:
            </p>
            <div
              style={{
                display: "flex",
                gap: "var(--space-2)",
                flexWrap: "wrap",
              }}
            >
              <Badge tone="success">Level: {app.approvedLevel ?? "—"}</Badge>
              <Badge tone={app.approvedGuideReady ? "success" : "neutral"}>
                {app.approvedGuideReady ? "Guide Ready ✓" : "Non-Guide Ready"}
              </Badge>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleOpenDashboard}
            >
              Buka Dashboard Destinasi &rarr;
            </Button>
          </div>
        </section>
      )}

      {/* REJECTED STATE */}
      {status === "REJECTED" && (
        <section className="eo-section" style={{ gap: "var(--space-4)" }}>
          <div className="admin-alert admin-alert--error" role="alert">
            <h2
              style={{
                fontSize: "var(--font-size-heading-sm)",
                margin: "0 0 var(--space-1)",
              }}
            >
              Verifikasi Memerlukan Perbaikan Data / Fasilitas
            </h2>
            <p style={{ margin: "0 0 var(--space-2)" }}>
              Catatan dari Tim Kurasi Admin:
            </p>
            <blockquote
              style={{
                margin: 0,
                padding: "var(--space-3)",
                background: "var(--color-stone-0)",
                borderLeft: "4px solid var(--color-danger-solid)",
                borderRadius: "var(--radius-xs)",
                fontStyle: "italic",
                color: "var(--color-text-primary)",
              }}
            >
              {app.rejectionReason ?? "Alasan verifikasi belum tersedia."}
            </blockquote>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Link
              to="/partner"
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "var(--font-size-body-sm)",
              }}
            >
              &larr; Kembali ke Portal Partner
            </Link>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleReapply}
            >
              Perbaiki & Ajukan Ulang
            </Button>
          </div>
        </section>
      )}

      {/* PENDING REVIEW STATE */}
      {status === "PENDING_REVIEW" && (
        <section className="eo-section" style={{ gap: "var(--space-4)" }}>
          <div className="admin-alert admin-alert--warning">
            <h2
              style={{
                fontSize: "var(--font-size-heading-sm)",
                margin: "0 0 var(--space-1)",
              }}
            >
              Pengajuan Verifikasi Sedang Ditinjau Admin
            </h2>
            <p style={{ margin: 0 }}>
              Formulir verifikasi lokasi diajukan pada{" "}
              <strong>
                {app.submittedAt
                  ? new Date(app.submittedAt).toLocaleDateString("id-ID")
                  : "hari ini"}
              </strong>
              . Tim Kurator Admin JedaIn sedang meninjau kelayakan standar
              ketenangan dan kesiapan operasional destinasi.
            </p>
          </div>

          {/* Quick Demo Switcher for Juror */}
          <div
            style={{
              padding: "var(--space-4)",
              background: "var(--color-bg-surface-subtle)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border-default)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong style={{ fontSize: "var(--font-size-body-sm)" }}>
                Simulasi Evaluasi Juri:
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Masuk sebagai akun destinasi demo terpisah yang sudah
                terverifikasi (Lereng Hijau Batu).
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSwitchToApprovedDemo}
            >
              Lihat Workspace Destinasi Demo
            </Button>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <Link
              to="/partner"
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "var(--font-size-body-sm)",
              }}
            >
              &larr; Kembali ke Portal Partner
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
