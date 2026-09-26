import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeftIcon } from "../../components/shells/icons";
import { Badge, Button } from "../../components/ui";
import { mockEoPackageStore } from "./mockEoPackageStore";
import { partnerSessionStore } from "./partnerSessionStore";
import "./eo.css";

function getFutureDefaultDateTimes() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const dd = String(tomorrow.getDate()).padStart(2, "0");
  return {
    start: `${yyyy}-${mm}-${dd}T08:00`,
    end: `${yyyy}-${mm}-${dd}T14:00`,
  };
}

export function EoSessionsScreen() {
  const { packageId } = useParams<{ packageId?: string }>();
  const partner = partnerSessionStore.get();
  const eoId = partner?.id ?? "eo_jeda_alam";

  const allEoPackages = mockEoPackageStore.getPackagesByEo(eoId);
  const eligiblePackages = allEoPackages.filter(
    (p) => p.status === "APPROVED" || p.status === "LIVE",
  );

  // Security check: if packageId param is passed, ensure it belongs to current EO
  const isForeignPackage = Boolean(
    packageId && !allEoPackages.some((p) => p.packageId === packageId),
  );

  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    packageId && !isForeignPackage
      ? packageId
      : (eligiblePackages[0]?.packageId ?? ""),
  );
  const [startDate, setStartDate] = useState<string>(
    () => getFutureDefaultDateTimes().start,
  );
  const [endDate, setEndDate] = useState<string>(
    () => getFutureDefaultDateTimes().end,
  );
  const [capacity, setCapacity] = useState<number>(6);
  const [operationalNote, setOperationalNote] = useState<string>("");
  const [editingNoteSessionId, setEditingNoteSessionId] = useState<
    string | null
  >(null);
  const [editingNoteText, setEditingNoteText] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [refreshVersion, setRefreshVersion] = useState<number>(0);

  const sessions = useMemo(() => {
    if (isForeignPackage) return [];
    if (selectedPackageId) {
      return mockEoPackageStore.getSessionsByPackage(selectedPackageId);
    }
    return mockEoPackageStore.getSessionsByEo(eoId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPackageId, eoId, refreshVersion, isForeignPackage]);

  if (isForeignPackage) {
    return (
      <div className="eo-container">
        <div
          className="eo-section"
          style={{ textAlign: "center", padding: "var(--space-8)" }}
        >
          <h2>Akses Ditolak</h2>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Paket ini tidak ditemukan atau bukan milik akun EO Anda.
          </p>
          <Link to="/partner/eo/packages" className="eo-back-btn">
            <ArrowLeftIcon className="eo-back-icon" />
            <span>Kembali ke Daftar Paket</span>
          </Link>
        </div>
      </div>
    );
  }

  const selectedPkg = allEoPackages.find(
    (p) => p.packageId === selectedPackageId,
  );

  const openAddModal = () => {
    const defaults = getFutureDefaultDateTimes();
    setStartDate(defaults.start);
    setEndDate(defaults.end);
    setFormError(undefined);
    setShowAddModal(true);
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(undefined);

    if (!selectedPackageId) {
      setFormError("Pilih paket experience terlebih dahulu.");
      return;
    }

    const startMs = Date.parse(startDate);
    const endMs = Date.parse(endDate);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      setFormError("Format tanggal dan waktu sesi tidak valid.");
      return;
    }

    const startIso = new Date(startMs).toISOString();
    const endIso = new Date(endMs).toISOString();

    const res = mockEoPackageStore.createSession({
      packageId: selectedPackageId,
      startAt: startIso,
      endAt: endIso,
      capacity,
      pricePerPerson: selectedPkg?.pricing.customerPrice ?? 275000,
      operationalNote: operationalNote.trim() || undefined,
    });

    if (res.success) {
      setShowAddModal(false);
      setOperationalNote("");
      const defaults = getFutureDefaultDateTimes();
      setStartDate(defaults.start);
      setEndDate(defaults.end);
      setRefreshVersion((v) => v + 1);
    } else {
      setFormError(res.message ?? "Gagal membuka sesi.");
    }
  };

  const handleToggleStatus = (
    sessionId: string,
    newStatus: "OPEN" | "CLOSED",
  ) => {
    const ok = mockEoPackageStore.updateSessionStatus(sessionId, newStatus);
    if (ok) {
      setRefreshVersion((v) => v + 1);
    }
  };

  const handleSaveSessionNote = (sessionId: string) => {
    mockEoPackageStore.updateSessionOperationalNote(
      sessionId,
      editingNoteText.trim() || undefined,
    );
    setEditingNoteSessionId(null);
    setEditingNoteText("");
    setRefreshVersion((v) => v + 1);
  };

  return (
    <div className="eo-container" data-version={refreshVersion}>
      {/* Contextual back navigation only when opened for a specific package */}
      {packageId && (
        <nav
          className="eo-pkg-detail-back-nav"
          aria-label="Navigasi kembali ke paket"
        >
          <Link
            to={`/partner/eo/packages/${packageId}`}
            className="eo-pkg-detail-back-link"
          >
            <ArrowLeftIcon className="eo-pkg-detail-back-icon" />
            <span>Kembali ke Paket</span>
          </Link>
        </nav>
      )}

      <header className="eo-page-header">
        <div className="eo-page-header__main">
          <Badge tone="info">Manajemen Jadwal Keberangkatan</Badge>
          <h1 className="eo-page-title" style={{ marginTop: "var(--space-2)" }}>
            Jadwal Sesi Perjalanan
          </h1>
          <p className="eo-page-subtitle">
            Buka jadwal sesi keberangkatan untuk paket yang telah disetujui
            (APPROVED / LIVE).
          </p>
        </div>

        {/* Primary Action Spotlight */}
        <aside
          className="eo-action-spotlight"
          aria-label="Aksi utama jadwal sesi"
        >
          <div className="eo-action-spotlight__copy">
            <span className="eo-action-spotlight__tag">Aksi Utama</span>
            <p className="eo-action-spotlight__desc">
              Tambahkan jadwal keberangkatan untuk paket yang siap berjalan.
            </p>
          </div>
          <button
            type="button"
            className="eo-action-spotlight__btn"
            disabled={eligiblePackages.length === 0}
            onClick={openAddModal}
            aria-label="Buka Sesi Baru"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="eo-action-spotlight__btn-icon"
            >
              <rect x="3" y="4" width="14" height="13" rx="2" />
              <line x1="13" y1="2" x2="13" y2="5" />
              <line x1="7" y1="2" x2="7" y2="5" />
              <line x1="3" y1="8" x2="17" y2="8" />
              <line x1="10" y1="11" x2="10" y2="15" />
              <line x1="8" y1="13" x2="12" y2="13" />
            </svg>
            <span>Buka Sesi Baru</span>
          </button>
        </aside>
      </header>

      {/* Package Selector Filter */}
      {allEoPackages.length > 0 && (
        <div className="eo-section" style={{ padding: "var(--space-4)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
              flexWrap: "wrap",
            }}
          >
            <label
              htmlFor="package-session-filter"
              style={{ fontWeight: 600, fontSize: "var(--font-size-body-sm)" }}
            >
              Pilih Paket:
            </label>
            <select
              id="package-session-filter"
              className="eo-form-select"
              style={{ maxWidth: "350px" }}
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
            >
              <option value="">Semua Paket Milik Saya</option>
              {allEoPackages.map((p) => (
                <option key={p.packageId} value={p.packageId}>
                  {p.title} ({p.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <section className="eo-section" aria-label="Daftar sesi">
        <div className="eo-section-header">
          <h2 className="eo-section-title">
            Daftar Sesi ({selectedPkg ? selectedPkg.title : "Semua Sesi"})
          </h2>
          <span
            style={{
              fontSize: "var(--font-size-caption)",
              color: "var(--color-text-secondary)",
            }}
          >
            Total: {sessions.length} Sesi Terbuka / Terjadwal
          </span>
        </div>

        {sessions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-8)",
              color: "var(--color-text-muted)",
            }}
          >
            <p>Belum ada jadwal sesi yang dibuat.</p>
            {eligiblePackages.length > 0 ? (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={openAddModal}
              >
                Buka Sesi Pertama
              </Button>
            ) : (
              <p
                style={{
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-warning-text)",
                }}
              >
                Sesi hanya dapat dibuka untuk paket yang sudah disetujui
                (APPROVED / LIVE).
              </p>
            )}
          </div>
        ) : (
          <div className="eo-table-wrapper">
            <table className="eo-table">
              <thead>
                <tr>
                  <th>Tanggal & Waktu</th>
                  <th>Kapasitas</th>
                  <th>Slot Tersedia</th>
                  <th>Harga Sesi</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((ses) => (
                  <tr key={ses.sessionId}>
                    <td>
                      <strong>
                        {new Date(ses.startAt).toLocaleDateString("id-ID", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </strong>
                      <div
                        style={{
                          fontSize: "var(--font-size-caption)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {new Date(ses.startAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(ses.endAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        WIB
                      </div>
                      {ses.operationalNote && (
                        <div
                          style={{
                            marginTop: "var(--space-2)",
                            padding: "var(--space-2) var(--space-3)",
                            background: "var(--color-bg-surface-subtle)",
                            borderRadius: "var(--radius-sm)",
                            borderLeft:
                              "2.5px solid var(--color-brand-primary)",
                            fontSize: "var(--font-size-caption)",
                            maxWidth: "340px",
                          }}
                        >
                          <strong
                            style={{
                              display: "block",
                              color: "var(--color-text-primary)",
                            }}
                          >
                            Catatan Operasional Terbaru:
                          </strong>
                          <p
                            style={{
                              margin: "0.2rem 0",
                              color: "var(--color-text-secondary)",
                              lineHeight: 1.4,
                            }}
                          >
                            {ses.operationalNote}
                          </p>
                          {ses.operationalNoteUpdatedAt && (
                            <span
                              style={{
                                fontSize: "0.7rem",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              Diperbarui:{" "}
                              {new Date(
                                ses.operationalNoteUpdatedAt,
                              ).toLocaleString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "Asia/Jakarta",
                              })}{" "}
                              WIB
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>{ses.capacity} orang</td>
                    <td>
                      <Badge
                        tone={ses.remainingSlots === 0 ? "danger" : "info"}
                      >
                        {ses.remainingSlots} tersisa
                      </Badge>
                    </td>
                    <td>Rp{ses.pricePerPerson.toLocaleString("id-ID")}</td>
                    <td>
                      <Badge
                        tone={
                          ses.status === "OPEN"
                            ? "success"
                            : ses.status === "FULL"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {ses.status}
                      </Badge>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "var(--space-2)",
                        }}
                      >
                        {ses.status === "OPEN" ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              handleToggleStatus(ses.sessionId, "CLOSED")
                            }
                          >
                            Tutup Sesi
                          </Button>
                        ) : ses.status === "CLOSED" ? (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              handleToggleStatus(ses.sessionId, "OPEN")
                            }
                          >
                            Buka Sesi
                          </Button>
                        ) : (
                          <span
                            style={{
                              fontSize: "var(--font-size-caption)",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            Penuh
                          </span>
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (editingNoteSessionId === ses.sessionId) {
                              setEditingNoteSessionId(null);
                              setEditingNoteText("");
                            } else {
                              setEditingNoteSessionId(ses.sessionId);
                              setEditingNoteText(ses.operationalNote ?? "");
                            }
                          }}
                        >
                          {editingNoteSessionId === ses.sessionId
                            ? "Batal"
                            : ses.operationalNote
                              ? "Ubah Catatan"
                              : "+ Catatan"}
                        </Button>
                      </div>

                      {editingNoteSessionId === ses.sessionId && (
                        <div
                          style={{
                            marginTop: "var(--space-2)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "var(--space-1)",
                          }}
                        >
                          <textarea
                            rows={2}
                            className="eo-form-textarea"
                            style={{
                              fontSize: "var(--font-size-caption)",
                              padding: "var(--space-2)",
                            }}
                            value={editingNoteText}
                            onChange={(e) => setEditingNoteText(e.target.value)}
                            placeholder="Catatan informasi operasional sesi..."
                          />
                          <div
                            style={{ display: "flex", gap: "var(--space-1)" }}
                          >
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                handleSaveSessionNote(ses.sessionId)
                              }
                            >
                              Simpan Catatan
                            </Button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add Session Modal / Dialog */}
      {showAddModal && (
        <div className="eo-modal-backdrop" role="dialog" aria-modal="true">
          <div className="eo-modal">
            <div className="eo-modal-header">
              <h2 className="eo-modal-title">Buka Sesi Keberangkatan Baru</h2>
              <button
                type="button"
                className="eo-modal-close"
                onClick={() => setShowAddModal(false)}
                aria-label="Tutup modal"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div
                className="eo-alert eo-alert--error"
                style={{ margin: "var(--space-4)" }}
                role="alert"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSession} className="eo-modal-body">
              <div className="eo-form-group">
                <label
                  htmlFor="session-package-select"
                  className="eo-form-label"
                >
                  Paket Experience *
                </label>
                <select
                  id="session-package-select"
                  required
                  className="eo-form-select"
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                >
                  {eligiblePackages.map((p) => (
                    <option key={p.packageId} value={p.packageId}>
                      {p.title} (Harga: Rp
                      {p.pricing.customerPrice.toLocaleString("id-ID")})
                    </option>
                  ))}
                </select>
              </div>

              <div className="eo-form-group">
                <label htmlFor="session-start-input" className="eo-form-label">
                  Waktu Mulai Keberangkatan *
                </label>
                <input
                  id="session-start-input"
                  type="datetime-local"
                  required
                  className="eo-form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="eo-form-group">
                <label htmlFor="session-end-input" className="eo-form-label">
                  Estimasi Waktu Selesai *
                </label>
                <input
                  id="session-end-input"
                  type="datetime-local"
                  required
                  className="eo-form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="eo-form-group">
                <label htmlFor="session-capacity" className="eo-form-label">
                  Kapasitas Peserta (Maksimal) *
                </label>
                <input
                  id="session-capacity"
                  type="number"
                  min={1}
                  max={30}
                  required
                  className="eo-form-input"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value) || 6)}
                />
              </div>

              <div className="eo-form-group">
                <label htmlFor="session-op-note" className="eo-form-label">
                  Catatan Operasional Terbaru (Opsional)
                </label>
                <textarea
                  id="session-op-note"
                  rows={2}
                  className="eo-form-textarea"
                  value={operationalNote}
                  onChange={(e) => setOperationalNote(e.target.value)}
                  placeholder="Contoh: Rute jalan kaki menggunakan jalur kebun teh sisi barat."
                />
                <span className="eo-form-helper">
                  Catatan informasi terbaru untuk pelaksanaan sesi. Catatan ini
                  tidak mengubah status atau aturan sesi.
                </span>
              </div>

              <div className="eo-modal-footer">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setShowAddModal(false)}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Simpan & Buka Sesi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
