import { Link, useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockApplicationStore } from "./mockApplicationStore";
import { partnerSessionStore } from "./partnerSessionStore";
import "./eo.css";

export function EoApplicationStatusScreen() {
  const navigate = useNavigate();
  const partner = partnerSessionStore.get();
  const application = partner
    ? mockApplicationStore.getBySellerId(partner.id)
    : mockApplicationStore.getAll()[0];

  const status = application?.status ?? "PENDING_REVIEW";

  const handleOpenDashboard = () => {
    navigate("/partner/eo");
  };

  const handleSwitchToApprovedDemo = () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    navigate("/partner/eo");
  };

  const handleReapply = () => {
    navigate("/partner/apply/eo");
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
            Status Pengajuan Mitra EO
          </h1>
          <p className="eo-page-subtitle">
            Penyelenggara:{" "}
            <strong>
              {application?.businessName ??
                partner?.businessName ??
                "EO Partner"}
            </strong>
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
              Selamat! Akun Event Organizer telah Disetujui
            </h2>
            <p style={{ margin: 0 }}>
              Tim Kurasi JedaIn telah memverifikasi profilmu. Kamu sekarang
              dapat mengakses demand insight traveler, merancang paket wellness
              terkurasi, dan mengelola jadwal perjalanan.
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
              Pengajuan Memerlukan Perbaikan Dokumen
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
              {application?.rejectionReason ??
                "Dokumen SOP penanganan darurat belum lengkap dan portofolio kegiatan wellness belum mencukupi standar kurasi JedaIn."}
            </blockquote>
          </div>

          <p
            style={{
              fontSize: "var(--font-size-body-sm)",
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            Kamu dapat memperbarui informasi formulir dengan identitas yang sama
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
              Formulir kemitraanmu telah diterima oleh Tim Kurasi JedaIn pada{" "}
              <strong>
                {application?.submittedAt
                  ? new Date(application.submittedAt).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )
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
              Lihat Workspace EO Demo (Approved)
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
