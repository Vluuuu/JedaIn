import { Link, useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import { mockApplicationStore } from "./mockApplicationStore";
import { partnerSessionStore } from "./partnerSessionStore";
import "./eo.css";

export function EoApplicationStatusScreen() {
  const navigate = useNavigate();
  const partner = partnerSessionStore.get();
  const isDestination = partner?.role === "DESTINATION";

  // If partner is Destination, route context to mockDestinationVerificationStore
  const destApp =
    isDestination && partner
      ? mockDestinationVerificationStore.getByPartnerId(partner.id)
      : undefined;

  const eoApp =
    !isDestination && partner
      ? mockApplicationStore.getBySellerId(partner.id)
      : mockApplicationStore.getAll()[0];

  const status = isDestination
    ? (destApp?.status ?? "PENDING_REVIEW")
    : (eoApp?.status ?? "PENDING_REVIEW");

  const businessName = isDestination
    ? (destApp?.name ?? partner?.businessName ?? "Destinasi Mitra")
    : (eoApp?.businessName ?? partner?.businessName ?? "EO Partner");

  const rejectionReason = isDestination
    ? (destApp?.rejectionReason ?? "Alasan verifikasi belum tersedia.")
    : (eoApp?.rejectionReason ?? "Alasan verifikasi belum tersedia.");

  const submittedAt = isDestination ? destApp?.submittedAt : eoApp?.submittedAt;

  const handleOpenDashboard = () => {
    if (isDestination) {
      navigate("/partner/destination");
    } else {
      navigate("/partner/eo");
    }
  };

  const handleSwitchToApprovedDemo = () => {
    if (isDestination) {
      partnerSessionStore.loginAsDemoDestination();
      navigate("/partner/destination");
    } else {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      navigate("/partner/eo");
    }
  };

  const handleReapply = () => {
    if (isDestination) {
      navigate("/partner/apply/destination");
    } else {
      navigate("/partner/apply/eo");
    }
  };

  return (
    <div
      className="eo-container"
      style={{ padding: "var(--space-8) var(--space-4)", maxWidth: "680px" }}
    >
      <header className="eo-page-header">
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
              ? "Kemitraan Disetujui"
              : status === "REJECTED"
                ? "Perlu Perbaikan"
                : "Sedang Ditinjau"}
          </Badge>
          <h1 className="eo-page-title" style={{ marginTop: "var(--space-2)" }}>
            Status{" "}
            {isDestination ? "Verifikasi Destinasi" : "Pengajuan Mitra EO"}
          </h1>
          <p className="eo-page-subtitle">
            Entitas: <strong>{businessName}</strong>
          </p>
        </div>
      </header>

      {/* APPROVED STATE */}
      {status === "APPROVED" && (
        <section className="eo-section" style={{ gap: "var(--space-5)" }}>
          <div className="eo-alert eo-alert--success">
            <h2
              style={{
                fontSize: "var(--font-size-heading-sm)",
                margin: "0 0 var(--space-1)",
              }}
            >
              Selamat! Akun Kemitraan telah Disetujui
            </h2>
            <p style={{ margin: 0 }}>
              Tim Kurasi JedaIn telah memverifikasi profil dan standar
              lokasi/pemandu Anda. Anda sekarang dapat mengakses dashboard
              operasional.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "var(--space-3)",
            }}
          >
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleOpenDashboard}
            >
              Buka Operational Dashboard &rarr;
            </Button>
          </div>
        </section>
      )}

      {/* REJECTED STATE */}
      {status === "REJECTED" && (
        <section className="eo-section" style={{ gap: "var(--space-5)" }}>
          <div className="eo-alert eo-alert--error" role="alert">
            <h2
              style={{
                fontSize: "var(--font-size-heading-sm)",
                margin: "0 0 var(--space-1)",
              }}
            >
              Pengajuan Memerlukan Perbaikan
            </h2>
            <p style={{ margin: "0 0 var(--space-2)" }}>
              Alasan kurator Admin JedaIn:
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
              {rejectionReason}
            </blockquote>
          </div>

          <p
            style={{
              fontSize: "var(--font-size-body-sm)",
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            Anda dapat memperbarui informasi formulir dengan identitas yang sama
            tanpa perlu mendaftar dari awal.
          </p>

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
              Perbaiki Pengajuan
            </Button>
          </div>
        </section>
      )}

      {/* PENDING REVIEW STATE */}
      {status === "PENDING_REVIEW" && (
        <section className="eo-section" style={{ gap: "var(--space-5)" }}>
          <div className="eo-alert eo-alert--warning">
            <h2
              style={{
                fontSize: "var(--font-size-heading-sm)",
                margin: "0 0 var(--space-1)",
              }}
            >
              Pengajuan Sedang Dalam Proses Kurasi
            </h2>
            <p style={{ margin: 0 }}>
              Formulir kemitraan Anda telah diterima oleh Tim Kurasi JedaIn pada{" "}
              <strong>
                {submittedAt
                  ? new Date(submittedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "hari ini"}
              </strong>
              . Kami memastikan standar keselamatan dan filosofi mindful travel
              sebelum mengaktifkan akses dashboard.
            </p>
          </div>

          {/* Demonstration Quick Switcher for Juror */}
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
                Gunakan identitas demo terpisah yang sudah berstatus APPROVED.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSwitchToApprovedDemo}
            >
              {isDestination
                ? "Lihat Workspace Destinasi Demo (Approved)"
                : "Lihat Workspace EO Demo (Approved)"}
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
