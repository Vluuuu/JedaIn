import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import { mockAdminDecisionService } from "./mockAdminDecisionService";
import "./admin.css";

export function AdminPackageReviewChecklistScreen() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const pkg = submissionId
    ? mockEoPackageStore.getPackageById(submissionId)
    : undefined;

  const [auditReason, setAuditReason] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!pkg) {
    return (
      <div className="admin-container">
        <div
          className="admin-section"
          style={{ textAlign: "center", padding: "var(--space-8)" }}
        >
          <h2>Paket Tidak Ditemukan</h2>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Data kurasi paket tidak valid atau telah diproses.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate("/admin/package-approvals")}
          >
            Kembali ke Antrean Paket
          </Button>
        </div>
      </div>
    );
  }

  const destination = mockDestinationStore.getById(pkg.destinationId);
  const isPending = pkg.status === "PENDING_ADMIN_REVIEW";

  const handleApprove = () => {
    setErrorMessage(undefined);
    if (!auditReason.trim()) {
      setErrorMessage("Catatan / alasan audit persetujuan paket wajib diisi.");
      return;
    }

    setIsProcessing(true);
    const res = mockAdminDecisionService.approvePackage(
      pkg.packageId,
      auditReason,
    );
    setIsProcessing(false);

    if (res.success) {
      navigate("/admin/package-approvals");
    } else {
      setErrorMessage(res.message ?? "Gagal memproses persetujuan paket.");
    }
  };

  const handleReject = () => {
    setErrorMessage(undefined);
    if (!rejectionReason.trim()) {
      setErrorMessage(
        "Catatan perbaikan / alasan penolakan paket wajib diisi.",
      );
      return;
    }

    setIsProcessing(true);
    const res = mockAdminDecisionService.rejectPackage(
      pkg.packageId,
      rejectionReason,
    );
    setIsProcessing(false);

    if (res.success) {
      navigate("/admin/package-approvals");
    } else {
      setErrorMessage(res.message ?? "Gagal menolak paket.");
    }
  };

  return (
    <div className="admin-container" style={{ maxWidth: "1000px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          to="/admin/package-approvals"
          style={{
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-body-sm)",
          }}
        >
          &larr; Kembali ke Antrean Paket
        </Link>
        <Badge
          tone={
            pkg.status === "APPROVED" || pkg.status === "LIVE"
              ? "success"
              : pkg.status === "REJECTED"
                ? "danger"
                : "warning"
          }
        >
          {pkg.status === "PENDING_ADMIN_REVIEW"
            ? "Menunggu Kurasi"
            : pkg.status}
        </Badge>
      </div>

      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{pkg.title}</h1>
          <p className="admin-page-subtitle">
            Penyelenggara: <strong>{pkg.eoDisplayName}</strong> (
            {pkg.guideStatus}) • Durasi: <strong>{pkg.durationLabel}</strong>
          </p>
        </div>
      </header>

      {errorMessage && (
        <div className="admin-alert admin-alert--error" role="alert">
          <strong>Perhatian:</strong>
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Human Inspection Checklist */}
      <section className="admin-section" aria-label="Daftar periksa kurasi">
        <h2 className="admin-section-title">Checklist Kurasi Standar JedaIn</h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          <div className="admin-checklist-item">
            <span
              style={{ color: "var(--color-success-text)", fontWeight: "bold" }}
            >
              ✓
            </span>
            <div>
              <strong>Validasi Otomatis Sistem Lolos</strong>
              <p
                style={{
                  margin: "0.125rem 0 0",
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Formula harga, kelengkapan judul, dan integritas data
                terverifikasi otomatis.
              </p>
            </div>
          </div>

          <div className="admin-checklist-item">
            <span
              style={{
                color: destination
                  ? "var(--color-success-text)"
                  : "var(--color-danger-text)",
                fontWeight: "bold",
              }}
            >
              {destination ? "✓" : "×"}
            </span>
            <div>
              <strong>
                Destinasi Terverifikasi (
                {destination?.name ?? pkg.destinationId})
              </strong>
              <p
                style={{
                  margin: "0.125rem 0 0",
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Level: {destination?.verificationLevel ?? "Tidak Valid"} • Guide
                Ready: {destination?.guideReady ? "Ya" : "Tidak"}
              </p>
            </div>
          </div>

          <div className="admin-checklist-item">
            <span
              style={{ color: "var(--color-success-text)", fontWeight: "bold" }}
            >
              ✓
            </span>
            <div>
              <strong>
                Ritme Itinerary Mindful & Teratur ({pkg.itinerary.length}{" "}
                Aktivitas)
              </strong>
              <p
                style={{
                  margin: "0.125rem 0 0",
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Alur kegiatan tidak terburu-buru dan memberikan ruang jeda yang
                cukup.
              </p>
            </div>
          </div>

          <div className="admin-checklist-item">
            <span
              style={{ color: "var(--color-success-text)", fontWeight: "bold" }}
            >
              ✓
            </span>
            <div>
              <strong>Transparansi Harga Sesuai Formula</strong>
              <p
                style={{
                  margin: "0.125rem 0 0",
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Modal Destinasi: Rp
                {pkg.pricing.destinationBaseCost.toLocaleString("id-ID")} +
                Margin EO: Rp{pkg.pricing.eoMargin.toLocaleString("id-ID")} =
                Total Rp{pkg.pricing.customerPrice.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Package Full Details Preview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "var(--space-6)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-5)",
          }}
        >
          <section className="admin-section">
            <h2 className="admin-section-title">Alur Itinerary Pengalaman</h2>
            <div className="eo-itinerary-list">
              {pkg.itinerary.map((item) => (
                <div key={item.order} className="eo-itinerary-item">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <strong>
                      #{item.order} {item.title}
                    </strong>
                    {item.durationLabel && (
                      <Badge tone="neutral">{item.durationLabel}</Badge>
                    )}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "var(--font-size-body-sm)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-section">
            <h2 className="admin-section-title">
              Catatan Keselamatan & Perlengkapan
            </h2>
            <ul
              style={{
                margin: 0,
                paddingLeft: "1.25rem",
                color: "var(--color-text-secondary)",
                fontSize: "var(--font-size-body-sm)",
              }}
            >
              {pkg.safetyNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right column: Decision Panel */}
        <div>
          {isPending ? (
            <section
              className="admin-decision-panel"
              aria-label="Panel persetujuan paket"
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "var(--font-size-heading-sm)",
                  color: "var(--color-text-primary)",
                }}
              >
                Keputusan Kurator
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Persetujuan akan mengubah status menjadi{" "}
                <strong>APPROVED</strong> agar EO dapat membuka jadwal sesi.
                Paket tidak langsung LIVE otomatis.
              </p>

              {/* Approve Box */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                  borderBottom: "1px solid var(--color-border-default)",
                  paddingBottom: "var(--space-4)",
                }}
              >
                <label htmlFor="admin-pkg-audit-note" className="eo-form-label">
                  Catatan Audit Persetujuan *
                </label>
                <textarea
                  id="admin-pkg-audit-note"
                  rows={2}
                  className="eo-form-textarea"
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="Catatan justifikasi kurasi paket..."
                />
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  loading={isProcessing}
                  onClick={handleApprove}
                >
                  Setujui Paket (APPROVED)
                </Button>
              </div>

              {/* Reject Box */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                <label
                  htmlFor="admin-pkg-reject-note"
                  className="eo-form-label"
                  style={{ color: "var(--color-danger-text)" }}
                >
                  Catatan Perbaikan / Tolak *
                </label>
                <textarea
                  id="admin-pkg-reject-note"
                  rows={2}
                  className="eo-form-textarea"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Jelaskan alasan perbaikan untuk EO..."
                />
                <Button
                  type="button"
                  variant="danger"
                  size="md"
                  loading={isProcessing}
                  onClick={handleReject}
                >
                  Tolak / Minta Revisi
                </Button>
              </div>
            </section>
          ) : (
            <section className="admin-section">
              <strong>Paket ini berstatus {pkg.status}.</strong>
              {pkg.rejectionReason && (
                <p
                  style={{
                    margin: "var(--space-1) 0 0",
                    color: "var(--color-danger-text)",
                    fontSize: "var(--font-size-body-sm)",
                  }}
                >
                  Alasan: "{pkg.rejectionReason}"
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
