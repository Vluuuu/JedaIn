import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockAdminDecisionService } from "./mockAdminDecisionService";
import { mockComplaintStore } from "./mockComplaintStore";
import "./admin.css";

export function AdminComplaintsScreen() {
  const { complaintId } = useParams<{ complaintId?: string }>();
  const navigate = useNavigate();

  const [refreshVersion, setRefreshVersion] = useState(0);
  const [category, setCategory] = useState<string>("OPERATIONAL_SAFETY");
  const [internalNote, setInternalNote] = useState<string>("");
  const [auditReason, setAuditReason] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);

  const complaints = mockComplaintStore.getAll();
  const directComplaint = complaintId
    ? mockComplaintStore.getById(complaintId)
    : undefined;

  // Single Direct Complaint Detail View if route is /admin/complaints/:complaintId
  if (complaintId) {
    if (!directComplaint) {
      return (
        <div className="admin-container">
          <div
            className="admin-section"
            style={{ textAlign: "center", padding: "var(--space-8)" }}
          >
            <h2>Aduan Tidak Ditemukan</h2>
            <p style={{ color: "var(--color-text-secondary)" }}>
              Aduan ID "{complaintId}" tidak valid atau tidak tersedia.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => navigate("/admin/complaints")}
            >
              Kembali ke Antrean Aduan
            </Button>
          </div>
        </div>
      );
    }

    const handleDirectClassify = (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage(undefined);

      if (!auditReason.trim()) {
        setErrorMessage("Catatan audit klasifikasi wajib diisi.");
        return;
      }

      setIsProcessing(true);
      const res = mockAdminDecisionService.classifyComplaint(
        directComplaint.complaintId,
        {
          category,
          internalNote,
          reason: auditReason,
        },
      );
      setIsProcessing(false);

      if (res.success) {
        setRefreshVersion((v) => v + 1);
        navigate("/admin/complaints");
      } else {
        setErrorMessage(res.message ?? "Gagal mengklasifikasikan aduan.");
      }
    };

    return (
      <div className="admin-container" style={{ maxWidth: "800px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link
            to="/admin/complaints"
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-body-sm)",
            }}
          >
            &larr; Kembali ke Antrean Aduan
          </Link>
          <Badge
            tone={
              directComplaint.priority === "CRITICAL"
                ? "danger"
                : directComplaint.priority === "HIGH"
                  ? "warning"
                  : "neutral"
            }
          >
            Prioritas: {directComplaint.priority}
          </Badge>
        </div>

        <header className="admin-page-header">
          <div>
            <h1 className="admin-page-title">
              Detail Aduan {directComplaint.complaintId}
            </h1>
            <p className="admin-page-subtitle">
              Diterima pada:{" "}
              {new Date(directComplaint.createdAt).toLocaleString("id-ID")} WIB
            </p>
          </div>
        </header>

        {errorMessage && (
          <div className="admin-alert admin-alert--error" role="alert">
            <strong>Perhatian:</strong>
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Complaint Details Card */}
        <section className="admin-section" aria-label="Rincian aduan">
          <h2 className="admin-section-title">Ringkasan Laporan Traveler</h2>
          <p
            style={{
              fontSize: "var(--font-size-body-md)",
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            "{directComplaint.summary}"
          </p>

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
                Target Entitas / Paket:
              </small>
              <strong>
                {directComplaint.targetType
                  ? `${directComplaint.targetType} (${directComplaint.targetRef})`
                  : (directComplaint.packageId ?? "—")}
              </strong>
            </div>

            <div>
              <small
                style={{ color: "var(--color-text-muted)", display: "block" }}
              >
                Nomor Booking Terkait:
              </small>
              <strong>{directComplaint.bookingId ?? "—"}</strong>
            </div>
          </div>
        </section>

        {/* Classification Form Panel */}
        <section
          className="admin-decision-panel"
          aria-label="Formulir klasifikasi aduan"
        >
          <h2
            style={{
              margin: 0,
              fontSize: "var(--font-size-heading-sm)",
              color: "var(--color-text-primary)",
            }}
          >
            Klasifikasi & Tindak Lanjut Administrator
          </h2>

          <form
            onSubmit={handleDirectClassify}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-3)",
            }}
          >
            <div className="eo-form-group">
              <label
                htmlFor="direct-complaint-category"
                className="eo-form-label"
              >
                Kategori Masalah:
              </label>
              <select
                id="direct-complaint-category"
                className="eo-form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="OPERATIONAL_SAFETY">
                  Operasional & Keselamatan Jalur
                </option>
                <option value="PUNCTUALITY">
                  Ketepatan Waktu Penjemputan / Sesi
                </option>
                <option value="MINDFUL_QUALITY">
                  Kualitas Ketenangan & Pemandu
                </option>
                <option value="FACILITY">Fasilitas & Konsumsi Lokal</option>
              </select>
            </div>

            <div className="eo-form-group">
              <label
                htmlFor="direct-complaint-internal-note"
                className="eo-form-label"
              >
                Catatan Tindak Lanjut Internal:
              </label>
              <textarea
                id="direct-complaint-internal-note"
                rows={2}
                className="eo-form-textarea"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Catatan koordinasi dengan EO / Destinasi..."
              />
            </div>

            <div className="eo-form-group">
              <label
                htmlFor="direct-complaint-audit-reason"
                className="eo-form-label"
              >
                Alasan Audit Administrator *:
              </label>
              <input
                id="direct-complaint-audit-reason"
                type="text"
                required
                className="eo-form-input"
                value={auditReason}
                onChange={(e) => setAuditReason(e.target.value)}
                placeholder="Justifikasi klasifikasi aduan..."
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "var(--space-2)",
                marginTop: "var(--space-3)",
              }}
            >
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => navigate("/admin/complaints")}
              >
                Kembali
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isProcessing}
              >
                Konfirmasi Klasifikasi
              </Button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  // Queue List View
  return (
    <div className="admin-container" data-version={refreshVersion}>
      <header className="admin-page-header">
        <div>
          <Badge tone="info">Tata Kelola & Aduan</Badge>
          <h1
            className="admin-page-title"
            style={{ marginTop: "var(--space-2)" }}
          >
            Antrean Aduan & Masukan Traveler
          </h1>
          <p className="admin-page-subtitle">
            Klasifikasikan laporan kendala operasional, keterlambatan, atau
            standar kenyamanan wellness.
          </p>
        </div>
      </header>

      <section className="admin-section" aria-label="Tabel antrean aduan">
        {complaints.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-8)",
              color: "var(--color-text-muted)",
            }}
          >
            <p>Tidak ada aduan traveler yang tercatat.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>No. Aduan</th>
                  <th>Prioritas</th>
                  <th>Kategori</th>
                  <th>Ringkasan Masukan</th>
                  <th>Target / Entitas</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.complaintId}>
                    <td>
                      <strong>{c.complaintId}</strong>
                    </td>
                    <td>
                      <Badge
                        tone={
                          c.priority === "CRITICAL"
                            ? "danger"
                            : c.priority === "HIGH"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {c.priority}
                      </Badge>
                    </td>
                    <td>{c.category}</td>
                    <td>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "var(--font-size-body-sm)",
                        }}
                      >
                        {c.summary}
                      </p>
                      {c.internalNote && (
                        <small
                          style={{
                            color: "var(--color-text-muted)",
                            display: "block",
                            marginTop: "0.25rem",
                          }}
                        >
                          Catatan Internal: "{c.internalNote}"
                        </small>
                      )}
                    </td>
                    <td>
                      {c.targetType ? `${c.targetType} (${c.targetRef})` : "—"}
                    </td>
                    <td>
                      <Badge
                        tone={
                          c.status === "RESOLVED"
                            ? "success"
                            : c.status === "CLASSIFIED"
                              ? "neutral"
                              : "warning"
                        }
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        type="button"
                        variant={
                          c.status === "UNRESOLVED" ? "primary" : "secondary"
                        }
                        size="sm"
                        onClick={() =>
                          navigate(`/admin/complaints/${c.complaintId}`)
                        }
                      >
                        {c.status === "UNRESOLVED"
                          ? "Klasifikasi"
                          : "Lihat Detail"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
