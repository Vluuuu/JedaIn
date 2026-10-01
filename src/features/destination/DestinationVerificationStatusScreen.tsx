import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button, StatusMeta } from "../../components/ui";
import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import {
  DemoAccountEmailNotice,
  PartnerDemoApproval,
} from "../eo/PartnerDemoApproval";
import { GuideIdentitySummary } from "./GuideIdentitySummary";
import "./destination.css";

export function DestinationVerificationStatusScreen() {
  const [, refresh] = useState(0);
  const navigate = useNavigate();
  const partner = partnerSessionStore.get();
  const app = partner
    ? mockDestinationVerificationStore.getByPartnerId(partner.id)
    : undefined;

  const handleOpenDashboard = () => {
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
        <header className="dest-page-header dest-verification-header">
          <div>
            <h1 className="dest-page-title">Status Verifikasi Destinasi</h1>
            <div className="dest-verification-meta">
              <dl className="dest-verification-place">
                <dt>Akun Mitra</dt>
                <dd>
                  <strong>{partner?.businessName ?? "Destinasi Baru"}</strong>
                </dd>
              </dl>
              <p className="dest-verification-status-line">
                <StatusMeta label="Status pengajuan">
                  Belum ada pengajuan
                </StatusMeta>
              </p>
            </div>
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
      <header className="dest-page-header dest-verification-header">
        <div>
          <h1 className="dest-page-title">Status Verifikasi Destinasi</h1>
          <div className="dest-verification-meta">
            <dl className="dest-verification-place">
              <dt>Kawasan</dt>
              <dd>
                <strong>{app.name}</strong> <span>({app.locationLabel})</span>
              </dd>
            </dl>
            <p className="dest-verification-status-line">
              <StatusMeta label="Status pengajuan">
                {status === "APPROVED"
                  ? "Disetujui"
                  : status === "REJECTED"
                    ? "Perlu perbaikan"
                    : "Menunggu verifikasi Admin"}
              </StatusMeta>
            </p>
          </div>
        </div>
      </header>

      {/* APPROVED STATE */}
      <GuideIdentitySummary guide={app.guideIdentity} />
      {status === "APPROVED" && (
        <section className="eo-section" style={{ gap: "var(--space-4)" }}>
          <DemoAccountEmailNotice
            email={app.demoEmailRecipient}
            accountEmail={app.accountEmail}
          />
          <div className="admin-alert admin-alert--success">
            <h2
              style={{
                fontSize: "var(--font-size-heading-sm)",
                margin: "0 0 var(--space-1)",
              }}
            >
              Destinasi Anda Disetujui JedaIn
            </h2>
            <p style={{ margin: "0 0 var(--space-2)" }}>
              {app.demoEmailRecipient
                ? "Pengajuan disetujui melalui simulasi demo dan destinasi Anda aktif sebagai Mitra Destinasi JedaIn."
                : "Lokasi Anda telah melalui proses verifikasi dan aktif sebagai Mitra Destinasi JedaIn."}
            </p>
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
          <PartnerDemoApproval
            onApproved={() => refresh((value) => value + 1)}
          />
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
              . Tim Kurator Admin JedaIn sedang meninjau kelayakan destinasi,
              fasilitas, SOP, dan bukti kesiapan pemandu lokal.
            </p>
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
