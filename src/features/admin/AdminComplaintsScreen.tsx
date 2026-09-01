import { useState } from "react";
import { Badge, Button } from "../../components/ui";
import { mockAdminDecisionService } from "./mockAdminDecisionService";
import { mockComplaintStore } from "./mockComplaintStore";
import type { ComplaintRecord } from "./types";
import "./admin.css";

export function AdminComplaintsScreen() {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [selectedComplaint, setSelectedComplaint] =
    useState<ComplaintRecord | null>(null);
  const [category, setCategory] = useState<string>("OPERATIONAL_SAFETY");
  const [internalNote, setInternalNote] = useState<string>("");
  const [auditReason, setAuditReason] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);

  const complaints = mockComplaintStore.getAll();

  const handleOpenClassify = (c: ComplaintRecord) => {
    setSelectedComplaint(c);
    setCategory(c.category);
    setInternalNote(c.internalNote ?? "");
    setAuditReason("");
    setErrorMessage(undefined);
  };

  const handleConfirmClassification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setErrorMessage(undefined);

    if (!auditReason.trim()) {
      setErrorMessage("Catatan audit klasifikasi wajib diisi.");
      return;
    }

    setIsProcessing(true);
    const res = mockAdminDecisionService.classifyComplaint(
      selectedComplaint.complaintId,
      {
        category,
        internalNote,
        reason: auditReason,
      },
    );
    setIsProcessing(false);

    if (res.success) {
      setSelectedComplaint(null);
      setRefreshVersion((v) => v + 1);
    } else {
      setErrorMessage(res.message ?? "Gagal mengklasifikasikan aduan.");
    }
  };

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
                        onClick={() => handleOpenClassify(c)}
                      >
                        {c.status === "UNRESOLVED"
                          ? "Klasifikasi"
                          : "Edit Catatan"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Classify Modal */}
      {selectedComplaint && (
        <div
          className="payment-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-classify-title"
        >
          <div className="payment-modal" style={{ maxWidth: "520px" }}>
            <h2
              id="modal-classify-title"
              style={{
                margin: "0 0 var(--space-3)",
                fontSize: "var(--font-size-heading-md)",
              }}
            >
              Klasifikasi Aduan {selectedComplaint.complaintId}
            </h2>

            {errorMessage && (
              <div
                className="admin-alert admin-alert--error"
                style={{ marginBottom: "var(--space-3)" }}
              >
                {errorMessage}
              </div>
            )}

            <form
              onSubmit={handleConfirmClassification}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
              }}
            >
              <div className="eo-form-group">
                <label htmlFor="complaint-category" className="eo-form-label">
                  Kategori Masalah:
                </label>
                <select
                  id="complaint-category"
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
                  htmlFor="complaint-internal-note"
                  className="eo-form-label"
                >
                  Catatan Tindak Lanjut Internal:
                </label>
                <textarea
                  id="complaint-internal-note"
                  rows={2}
                  className="eo-form-textarea"
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Catatan koordinasi dengan EO / Destinasi..."
                />
              </div>

              <div className="eo-form-group">
                <label
                  htmlFor="complaint-audit-reason"
                  className="eo-form-label"
                >
                  Alasan Audit Administrator *:
                </label>
                <input
                  id="complaint-audit-reason"
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
                  onClick={() => setSelectedComplaint(null)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={isProcessing}
                >
                  Simpan Klasifikasi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
