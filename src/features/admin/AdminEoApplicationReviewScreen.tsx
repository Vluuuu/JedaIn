import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockApplicationStore } from "../eo/mockApplicationStore";
import { mockAdminDecisionService } from "./mockAdminDecisionService";
import "./admin.css";

export function AdminEoApplicationReviewScreen() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const application = applicationId
    ? mockApplicationStore.getById(applicationId)
    : undefined;

  const [auditReason, setAuditReason] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!application) {
    return (
      <div className="admin-container">
        <div
          className="admin-section"
          style={{ textAlign: "center", padding: "var(--space-8)" }}
        >
          <h2>Aplikasi EO Tidak Ditemukan</h2>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Data pengajuan tidak valid atau telah dihapus.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate("/admin/eo-approvals")}
          >
            Kembali ke Antrean EO
          </Button>
        </div>
      </div>
    );
  }

  const isPending = application.status === "PENDING_REVIEW";

  const handleApprove = () => {
    setErrorMessage(undefined);
    if (!auditReason.trim()) {
      setErrorMessage("Catatan / alasan audit persetujuan wajib diisi.");
      return;
    }

    setIsProcessing(true);
    const res = mockAdminDecisionService.approveEoApplication(
      application.applicationId,
      auditReason,
    );
    setIsProcessing(false);

    if (res.success) {
      navigate("/admin/eo-approvals");
    } else {
      setErrorMessage(res.message ?? "Gagal memproses persetujuan.");
    }
  };

  const handleReject = () => {
    setErrorMessage(undefined);
    if (!rejectionReason.trim()) {
      setErrorMessage(
        "Alasan penolakan aplikasi wajib diisi secara jelas untuk panduan perbaikan mitra.",
      );
      return;
    }

    setIsProcessing(true);
    const res = mockAdminDecisionService.rejectEoApplication(
      application.applicationId,
      rejectionReason,
    );
    setIsProcessing(false);

    if (res.success) {
      navigate("/admin/eo-approvals");
    } else {
      setErrorMessage(res.message ?? "Gagal memproses penolakan.");
    }
  };

  return (
    <div className="admin-container" style={{ maxWidth: "960px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          to="/admin/eo-approvals"
          style={{
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-body-sm)",
          }}
        >
          &larr; Kembali ke Antrean EO
        </Link>
        <Badge
          tone={
            application.status === "APPROVED"
              ? "success"
              : application.status === "REJECTED"
                ? "danger"
                : "warning"
          }
        >
          {application.status === "PENDING_REVIEW"
            ? "Menunggu Peninjauan"
            : application.status}
        </Badge>
      </div>

      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{application.businessName}</h1>
          <p className="admin-page-subtitle">
            Penanggung Jawab: <strong>{application.contactPerson}</strong> •
            Wilayah:{" "}
            <strong>
              {application.city}, {application.province}
            </strong>
          </p>
        </div>
      </header>

      {errorMessage && (
        <div className="admin-alert admin-alert--error" role="alert">
          <strong>Perhatian:</strong>
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Application Data Grid */}
      <section className="admin-section" aria-label="Rincian data aplikasi">
        <h2 className="admin-section-title">Rincian Informasi Mitra</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-4)",
            fontSize: "var(--font-size-body-sm)",
          }}
        >
          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Kontak WhatsApp & Email:
            </small>
            <strong>{application.phone}</strong> • {application.email}
          </div>

          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Kategori Kesiapan Pemandu:
            </small>
            <Badge
              tone={
                application.guideStatus === "CERTIFIED_GUIDE"
                  ? "success"
                  : "neutral"
              }
            >
              {application.guideStatus === "CERTIFIED_GUIDE"
                ? "Certified Guide"
                : "Concept-Only"}
            </Badge>
          </div>

          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Lama Beroperasi:
            </small>
            <strong>{application.yearsOfOperation} Tahun</strong>
          </div>

          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Portofolio / Tautan:
            </small>
            <strong>{application.portfolioLink ?? "—"}</strong>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--color-border-default)",
            paddingTop: "var(--space-3)",
          }}
        >
          <small style={{ color: "var(--color-text-muted)", display: "block" }}>
            Deskripsi Pengalaman & Filosofi:
          </small>
          <p
            style={{
              margin: "var(--space-1) 0 0",
              fontSize: "var(--font-size-body-sm)",
              color: "var(--color-text-primary)",
            }}
          >
            {application.experienceDescription}
          </p>
        </div>

        {/* Prototype Documents Metadata */}
        <div
          style={{
            borderTop: "1px solid var(--color-border-default)",
            paddingTop: "var(--space-3)",
          }}
        >
          <small
            style={{
              color: "var(--color-text-muted)",
              display: "block",
              marginBottom: "var(--space-2)",
            }}
          >
            Dokumen & Kepatuhan SOP:
          </small>
          <div
            style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}
          >
            {application.guideCertificateDoc && (
              <span
                style={{
                  fontSize: "var(--font-size-caption)",
                  padding: "0.25rem 0.5rem",
                  background: "var(--color-bg-surface-subtle)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border-default)",
                }}
              >
                📄 Sertifikat: {application.guideCertificateDoc.name} (
                {application.guideCertificateDoc.status})
              </span>
            )}
            {application.insuranceDoc && (
              <span
                style={{
                  fontSize: "var(--font-size-caption)",
                  padding: "0.25rem 0.5rem",
                  background: "var(--color-bg-surface-subtle)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border-default)",
                }}
              >
                🛡️ Asuransi/SOP: {application.insuranceDoc.name} (
                {application.insuranceDoc.status})
              </span>
            )}
            <Badge tone="success">SOP JedaIn Disetujui ✓</Badge>
          </div>
        </div>
      </section>

      {/* Decision Panel for PENDING_REVIEW */}
      {isPending ? (
        <section
          className="admin-decision-panel"
          aria-label="Panel keputusan kurator"
        >
          <h2
            style={{
              margin: 0,
              fontSize: "var(--font-size-heading-sm)",
              color: "var(--color-text-primary)",
            }}
          >
            Keputusan Kurasi Administrator
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-6)",
            }}
          >
            {/* Approve Action Box */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
              }}
            >
              <strong style={{ color: "var(--color-success-text)" }}>
                Opsi 1: Setujui Kemitraan (Approve)
              </strong>
              <div className="eo-form-group">
                <label htmlFor="admin-audit-note" className="eo-form-label">
                  Catatan Audit Persetujuan *
                </label>
                <textarea
                  id="admin-audit-note"
                  rows={2}
                  className="eo-form-textarea"
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="Misal: Dokumen kepemanduan valid dan pengalaman retreat memenuhi standar."
                />
              </div>
              <Button
                type="button"
                variant="primary"
                size="md"
                loading={isProcessing}
                onClick={handleApprove}
              >
                Setujui Akun EO
              </Button>
            </div>

            {/* Reject Action Box */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
                borderLeft: "1px solid var(--color-border-default)",
                paddingLeft: "var(--space-6)",
              }}
            >
              <strong style={{ color: "var(--color-danger-text)" }}>
                Opsi 2: Tolak / Minta Perbaikan (Reject)
              </strong>
              <div className="eo-form-group">
                <label htmlFor="admin-rejection-note" className="eo-form-label">
                  Alasan Penolakan Spesifik *
                </label>
                <textarea
                  id="admin-rejection-note"
                  rows={2}
                  className="eo-form-textarea"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Jelaskan kekurangan dokumen atau SOP yang perlu diperbaiki mitra..."
                />
              </div>
              <Button
                type="button"
                variant="danger"
                size="md"
                loading={isProcessing}
                onClick={handleReject}
              >
                Tolak Aplikasi EO
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="admin-section">
          <strong>
            Aplikasi ini telah selesai diproses ({application.status}).
          </strong>
          {application.rejectionReason && (
            <p
              style={{
                margin: "var(--space-1) 0 0",
                color: "var(--color-danger-text)",
              }}
            >
              Alasan penolakan: "{application.rejectionReason}"
            </p>
          )}
        </section>
      )}
    </div>
  );
}
