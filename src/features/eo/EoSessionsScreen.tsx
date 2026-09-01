import { useState } from "react";
import { useParams } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockEoPackageStore } from "./mockEoPackageStore";
import { partnerSessionStore } from "./partnerSessionStore";
import "./eo.css";

export function EoSessionsScreen() {
  const { packageId } = useParams<{ packageId?: string }>();
  const partner = partnerSessionStore.get();
  const eoId = partner?.id ?? "eo_jeda_alam";

  const allEoPackages = mockEoPackageStore.getPackagesByEo(eoId);
  const eligiblePackages = allEoPackages.filter(
    (p) => p.status === "APPROVED" || p.status === "LIVE",
  );

  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    packageId ?? eligiblePackages[0]?.packageId ?? "",
  );
  const [startDate, setStartDate] = useState<string>("2026-09-26T08:00");
  const [endDate, setEndDate] = useState<string>("2026-09-26T14:00");
  const [capacity, setCapacity] = useState<number>(6);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | undefined>();

  const sessions = selectedPackageId
    ? mockEoPackageStore.getSessionsByPackage(selectedPackageId)
    : mockEoPackageStore.getSessionsByEo(eoId);

  const selectedPkg = allEoPackages.find(
    (p) => p.packageId === selectedPackageId,
  );

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(undefined);

    if (!selectedPackageId) {
      setFormError("Pilih paket experience terlebih dahulu.");
      return;
    }

    const startIso = new Date(startDate).toISOString();
    const endIso = new Date(endDate).toISOString();

    const res = mockEoPackageStore.createSession({
      packageId: selectedPackageId,
      eoId,
      startAt: startIso,
      endAt: endIso,
      capacity,
      pricePerPerson: selectedPkg?.pricing.customerPrice ?? 275000,
    });

    if (res.success) {
      setShowAddModal(false);
    } else {
      setFormError(res.message ?? "Gagal membuka sesi.");
    }
  };

  return (
    <div className="eo-container">
      <header className="eo-page-header">
        <div>
          <Badge tone="info">Manajemen Jadwal Keberangkatan</Badge>
          <h1 className="eo-page-title" style={{ marginTop: "var(--space-2)" }}>
            Jadwal Sesi Perjalanan
          </h1>
          <p className="eo-page-subtitle">
            Buka jadwal sesi keberangkatan untuk paket yang telah disetujui
            (APPROVED / LIVE).
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={eligiblePackages.length === 0}
          onClick={() => setShowAddModal(true)}
        >
          + Buka Sesi Baru
        </Button>
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
              style={{ maxWidth: "360px" }}
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
            >
              <option value="">-- Semua Sesi EO --</option>
              {allEoPackages.map((p) => (
                <option key={p.packageId} value={p.packageId}>
                  {p.title} ({p.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Sessions Table */}
      <section className="eo-section" aria-label="Daftar jadwal sesi">
        {sessions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-8)",
              color: "var(--color-text-muted)",
            }}
          >
            <p>Belum ada sesi jadwal yang dibuka untuk paket ini.</p>
            {eligiblePackages.length > 0 ? (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setShowAddModal(true)}
              >
                Buka Jadwal Pertama
              </Button>
            ) : (
              <p style={{ fontSize: "var(--font-size-caption)" }}>
                Hanya paket berstatus APPROVED atau LIVE yang dapat membuka
                jadwal.
              </p>
            )}
          </div>
        ) : (
          <div className="eo-table-wrapper">
            <table className="eo-table">
              <thead>
                <tr>
                  <th>Waktu Keberangkatan</th>
                  <th>Paket</th>
                  <th>Kapasitas</th>
                  <th>Sisa Slot</th>
                  <th>Harga / Orang</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const pkg = allEoPackages.find(
                    (p) => p.packageId === s.packageId,
                  );
                  const startLabel = new Date(s.startAt).toLocaleString(
                    "id-ID",
                    {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  );
                  return (
                    <tr key={s.sessionId}>
                      <td>
                        <strong>{startLabel} WIB</strong>
                      </td>
                      <td>{pkg?.title ?? s.packageId}</td>
                      <td>{s.capacity} Orang</td>
                      <td>
                        <strong>{s.remainingSlots}</strong> / {s.capacity}
                      </td>
                      <td>Rp{s.pricePerPerson.toLocaleString("id-ID")}</td>
                      <td>
                        <Badge
                          tone={
                            s.status === "OPEN"
                              ? "success"
                              : s.status === "FULL"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {s.status}
                        </Badge>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "var(--space-2)" }}>
                          {s.status === "OPEN" && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                mockEoPackageStore.updateSessionStatus(
                                  s.sessionId,
                                  "CLOSED",
                                );
                                setSelectedPackageId((prev) => prev); // force re-render
                              }}
                            >
                              Tutup Sesi
                            </Button>
                          )}
                          {s.status === "CLOSED" && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                mockEoPackageStore.updateSessionStatus(
                                  s.sessionId,
                                  "OPEN",
                                );
                                setSelectedPackageId((prev) => prev);
                              }}
                            >
                              Buka Sesi
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Buka Sesi Baru */}
      {showAddModal && (
        <div
          className="payment-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-modal-title"
        >
          <div className="payment-modal" style={{ maxWidth: "480px" }}>
            <h2
              id="session-modal-title"
              style={{
                margin: "0 0 var(--space-3)",
                fontSize: "var(--font-size-heading-md)",
              }}
            >
              Buka Jadwal Sesi Baru
            </h2>

            {formError && (
              <div
                className="eo-alert eo-alert--error"
                style={{ marginBottom: "var(--space-3)" }}
              >
                {formError}
              </div>
            )}

            <form
              onSubmit={handleCreateSession}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
              }}
            >
              <div className="eo-form-group">
                <label className="eo-form-label">
                  Paket Experience (Hanya APPROVED / LIVE):
                </label>
                <select
                  required
                  className="eo-form-select"
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                >
                  <option value="" disabled>
                    Pilih paket...
                  </option>
                  {eligiblePackages.map((p) => (
                    <option key={p.packageId} value={p.packageId}>
                      {p.title} (Rp
                      {p.pricing.customerPrice.toLocaleString("id-ID")})
                    </option>
                  ))}
                </select>
              </div>

              <div className="eo-form-group">
                <label className="eo-form-label">
                  Waktu Mulai Keberangkatan:
                </label>
                <input
                  type="datetime-local"
                  required
                  className="eo-form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="eo-form-group">
                <label className="eo-form-label">Waktu Selesai:</label>
                <input
                  type="datetime-local"
                  required
                  className="eo-form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="eo-form-group">
                <label className="eo-form-label">
                  Kapasitas Maksimal Peserta:
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  className="eo-form-input"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value) || 1)}
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
