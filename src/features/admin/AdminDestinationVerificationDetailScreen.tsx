import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockAdminDecisionService } from "./mockAdminDecisionService";
import { mockDestinationVerificationStore } from "./mockDestinationVerificationStore";
import "./admin.css";

export function AdminDestinationVerificationDetailScreen() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const destApp = applicationId
    ? mockDestinationVerificationStore.getById(applicationId)
    : undefined;

  const [auditReason, setAuditReason] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!destApp) {
    return (
      <div className="admin-container">
        <div
          className="admin-section"
          style={{ textAlign: "center", padding: "var(--space-8)" }}
        >
          <h2>Pengajuan Destinasi Tidak Ditemukan</h2>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Data verifikasi destinasi tidak valid atau telah diproses.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate("/admin/destination-verifications")}
          >
            Kembali ke Antrean Destinasi
          </Button>
        </div>
      </div>
    );
  }

  const isPending = destApp.status === "PENDING_REVIEW";

  const handleApprove = (guideReady: boolean) => {
    setErrorMessage(undefined);
    if (!auditReason.trim()) {
      setErrorMessage(
        "Catatan / alasan audit verifikasi destinasi wajib diisi.",
      );
      return;
    }

    setIsProcessing(true);
    const res = mockAdminDecisionService.approveDestinationVerification(
      destApp.applicationId,
      guideReady,
      auditReason,
    );
    setIsProcessing(false);

    if (res.success) {
      navigate("/admin/destination-verifications");
    } else {
      setErrorMessage(res.message ?? "Gagal memproses verifikasi destinasi.");
    }
  };

  const handleReject = () => {
    setErrorMessage(undefined);
    if (!rejectionReason.trim()) {
      setErrorMessage("Alasan penolakan destinasi wajib diisi secara jelas.");
      return;
    }

    setIsProcessing(true);
    const res = mockAdminDecisionService.rejectDestinationVerification(
      destApp.applicationId,
      rejectionReason,
    );
    setIsProcessing(false);

    if (res.success) {
      navigate("/admin/destination-verifications");
    } else {
      setErrorMessage(res.message ?? "Gagal menolak destinasi.");
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
          to="/admin/destination-verifications"
          style={{
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-body-sm)",
          }}
        >
          &larr; Kembali ke Antrean Destinasi
        </Link>
        <Badge
          tone={
            destApp.status === "APPROVED"
              ? "success"
              : destApp.status === "REJECTED"
                ? "danger"
                : "warning"
          }
        >
          {destApp.status === "PENDING_REVIEW"
            ? "Menunggu Verifikasi"
            : destApp.status}
        </Badge>
      </div>

      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{destApp.name}</h1>
          <p className="admin-page-subtitle">
            Lokasi: <strong>{destApp.locationLabel}</strong> • Modal Dasar:{" "}
            <strong>
              Rp{destApp.baseCostPerPerson.toLocaleString("id-ID")} / orang
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

      {/* Destination Profile & Description */}
      <section className="admin-section" aria-label="Profil destinasi">
        <h2 className="admin-section-title">Profil & Lingkungan Destinasi</h2>

        <p
          style={{
            fontSize: "var(--font-size-body-md)",
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          {destApp.description}
        </p>

        {destApp.highlights && destApp.highlights.length > 0 && (
          <div style={{ marginTop: "var(--space-3)" }}>
            <strong
              style={{
                fontSize: "var(--font-size-body-sm)",
                color: "var(--color-text-primary)",
                display: "block",
                marginBottom: "var(--space-1)",
              }}
            >
              Fasilitas & Daya Tarik Alam:
            </strong>
            <ul
              style={{
                margin: 0,
                paddingLeft: "1.25rem",
                color: "var(--color-text-secondary)",
                fontSize: "var(--font-size-body-sm)",
              }}
            >
              {destApp.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}

        <div
          style={{
            borderTop: "1px solid var(--color-border-default)",
            paddingTop: "var(--space-3)",
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
              Entitas Pengelola & Penanggung Jawab:
            </small>
            <strong>
              {destApp.managementName || destApp.contactPerson
                ? `${destApp.managementName ?? "Pengelola"} (${destApp.contactPerson ?? "PJ"})`
                : "Pengelola Destinasi"}
            </strong>
            {(destApp.contactPhone || destApp.contactEmail) && (
              <small
                style={{
                  display: "block",
                  color: "var(--color-text-secondary)",
                  marginTop: "var(--space-1)",
                }}
              >
                {[destApp.contactPhone, destApp.contactEmail]
                  .filter(Boolean)
                  .join(" • ")}
              </small>
            )}
          </div>

          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Kapasitas Maksimal per Sesi:
            </small>
            <strong>{destApp.capacityPerSession} Orang</strong>
          </div>

          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Status Dokumen Legalitas (Metadata):
            </small>
            <strong>
              {destApp.legalEntityDocument
                ? `📄 ${destApp.legalEntityDocument.name} (${destApp.legalEntityDocument.status})`
                : "Belum ada metadata dokumen"}
            </strong>
          </div>

          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Deklarasi & Bukti Kesiapan Pemandu Lokal:
            </small>
            <div style={{ marginTop: "var(--space-1)" }}>
              <Badge tone={destApp.declaredGuideReady ? "success" : "neutral"}>
                {destApp.declaredGuideReady
                  ? "Deklarasi: Guide Ready"
                  : "Deklarasi: Belum Guide Ready"}
              </Badge>
            </div>
            <p
              style={{
                margin: "0.25rem 0 0",
                color: "var(--color-text-secondary)",
              }}
            >
              {destApp.guideReadinessEvidence}
            </p>
          </div>
        </div>
      </section>

      {/* Decision Panel for PENDING_REVIEW */}
      {isPending ? (
        <section
          className="admin-decision-panel"
          aria-label="Panel keputusan verifikasi"
        >
          <h2
            style={{
              margin: 0,
              fontSize: "var(--font-size-heading-sm)",
              color: "var(--color-text-primary)",
            }}
          >
            Keputusan Verifikasi Destinasi
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "var(--font-size-caption)",
              color: "var(--color-text-secondary)",
            }}
          >
            Catatan: Persetujuan awal selalu memberikan level{" "}
            <strong>BASIC</strong>. Level PLUS hanya dapat diberikan melalui
            promosi trust lifecycle lanjutan.
          </p>

          <div className="eo-form-group">
            <label htmlFor="admin-dest-audit-note" className="eo-form-label">
              Catatan / Justifikasi Audit Admin *
            </label>
            <textarea
              id="admin-dest-audit-note"
              rows={2}
              className="eo-form-textarea"
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              placeholder="Tuliskan justifikasi kelayakan ketenangan lokasi dan kesiapan pemandu..."
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-4)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              <Button
                type="button"
                variant="primary"
                size="md"
                loading={isProcessing}
                onClick={() => handleApprove(true)}
              >
                Setujui: BASIC + Guide Ready ✓
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                loading={isProcessing}
                onClick={() => handleApprove(false)}
              >
                Setujui: BASIC (Tanpa Guide Lokal)
              </Button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
                borderLeft: "1px solid var(--color-border-default)",
                paddingLeft: "var(--space-4)",
              }}
            >
              <input
                type="text"
                className="eo-form-input"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Alasan penolakan destinasi..."
              />
              <Button
                type="button"
                variant="danger"
                size="md"
                loading={isProcessing}
                onClick={handleReject}
              >
                Tolak Pengajuan Destinasi
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="admin-section">
          <strong>
            Destinasi ini telah selesai diproses ({destApp.status}).
          </strong>
          {destApp.approvedLevel && (
            <p
              style={{
                margin: "var(--space-1) 0 0",
                color: "var(--color-success-text)",
              }}
            >
              Level: {destApp.approvedLevel}{" "}
              {destApp.approvedGuideReady
                ? "(Guide Ready ✓)"
                : "(Non-Guide Ready)"}
            </p>
          )}
          {destApp.rejectionReason && (
            <p
              style={{
                margin: "var(--space-1) 0 0",
                color: "var(--color-danger-text)",
              }}
            >
              Alasan penolakan: "{destApp.rejectionReason}"
            </p>
          )}
        </section>
      )}
    </div>
  );
}
