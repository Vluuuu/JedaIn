import { Badge } from "../../components/ui";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import { resolveAuthenticatedDestinationContext } from "./destinationContext";
import "./destination.css";

export function DestinationCapacityScreen() {
  const context = resolveAuthenticatedDestinationContext();
  const destination = context?.destination;
  const destinationIdentityId =
    destination?.destinationId ?? "dest_lereng_hijau";

  const baseVenueCapacity = destination?.capacityPerSession ?? 20;

  // Filter packages and sessions for this destination
  const allPackages = mockEoPackageStore.getAllPackages();
  const venuePackages = allPackages.filter(
    (p) => p.destinationId === destinationIdentityId,
  );
  const venuePackageIds = new Set(venuePackages.map((p) => p.packageId));

  const allSessions = mockEoPackageStore.getAllSessions();
  const venueSessions = allSessions.filter((s) =>
    venuePackageIds.has(s.packageId),
  );
  const allBookings = mockTransactionStore.getBookings();

  return (
    <div className="dest-container">
      <header className="dest-page-header">
        <div>
          <Badge tone="info">Pengawasan Kapasitas Kawasan</Badge>
          <h1
            className="dest-page-title"
            style={{ marginTop: "var(--space-2)" }}
          >
            Kapasitas & Alokasi Pengunjung Venue
          </h1>
          <p className="dest-page-subtitle">
            Memantau daya tampung kawasan per sesi di{" "}
            {destination?.name ?? "lokasi"}, alokasi kuota yang dibuka EO, dan
            jumlah peserta terkonfirmasi.
          </p>
        </div>
      </header>

      {/* Capacity Overview Stats (DP09 Core) */}
      <section className="dest-stats-grid" aria-label="Ringkasan kapasitas">
        <div className="dest-stat-card">
          <span className="dest-stat-label">Batas Kapasitas Venue</span>
          <strong className="dest-stat-value">{baseVenueCapacity}</strong>
          <span className="dest-stat-desc">Orang maksimal per sesi</span>
        </div>

        <div className="dest-stat-card">
          <span className="dest-stat-label">Total Sesi Terjadwal</span>
          <strong className="dest-stat-value">{venueSessions.length}</strong>
          <span className="dest-stat-desc">Sesi trip aktif</span>
        </div>

        <div className="dest-stat-card">
          <span className="dest-stat-label">Total Alokasi Sesi EO</span>
          <strong className="dest-stat-value">
            {venueSessions.reduce((sum, s) => sum + s.capacity, 0)}
          </strong>
          <span className="dest-stat-desc">Slot dibuka oleh mitra EO</span>
        </div>

        <div className="dest-stat-card">
          <span className="dest-stat-label">Total Peserta Terkonfirmasi</span>
          <strong className="dest-stat-value">
            {allBookings
              .filter(
                (b) =>
                  venuePackageIds.has(b.packageId) &&
                  (b.status === "PAID" || b.status === "COMPLETED"),
              )
              .reduce((sum, b) => sum + b.bookedQuantity, 0)}
          </strong>
          <span className="dest-stat-desc">Traveler telah membayar</span>
        </div>
      </section>

      {/* Sessions Capacity Allocation Breakdown */}
      <section className="eo-section" aria-label="Rincian alokasi sesi">
        <div className="eo-section-header">
          <div>
            <h2 className="eo-section-title">
              Alokasi Kapasitas per Sesi Perjalanan
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "var(--font-size-caption)",
                color: "var(--color-text-secondary)",
              }}
            >
              Kapasitas sesi diatur oleh EO saat membuka jadwal dan dibatasi
              maksimal oleh kapasitas dasar venue ({baseVenueCapacity} orang).
            </p>
          </div>
        </div>

        {venueSessions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-8)",
              color: "var(--color-text-muted)",
            }}
          >
            <p>Belum ada sesi perjalanan EO yang dijadwalkan di kawasan ini.</p>
          </div>
        ) : (
          <div className="eo-table-wrapper">
            <table className="eo-table">
              <thead>
                <tr>
                  <th>Sesi Jadwal</th>
                  <th>Paket & EO</th>
                  <th>Batas Venue</th>
                  <th>Alokasi Kuota EO</th>
                  <th>Peserta Terkonfirmasi</th>
                  <th>Sisa Ruang Operasional</th>
                </tr>
              </thead>
              <tbody>
                {venueSessions.map((s) => {
                  const pkg = venuePackages.find(
                    (p) => p.packageId === s.packageId,
                  );
                  const confirmedCount = allBookings
                    .filter(
                      (b) =>
                        b.sessionId === s.sessionId &&
                        (b.status === "PAID" || b.status === "COMPLETED"),
                    )
                    .reduce((sum, b) => sum + b.bookedQuantity, 0);

                  const headroom = Math.max(
                    0,
                    baseVenueCapacity - confirmedCount,
                  );
                  const dateLabel = new Date(s.startAt).toLocaleDateString(
                    "id-ID",
                    {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  );

                  return (
                    <tr key={s.sessionId}>
                      <td>
                        <strong>{dateLabel}</strong>
                        <div
                          style={{
                            fontSize: "var(--font-size-caption)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {s.sessionId}
                        </div>
                      </td>
                      <td>
                        <strong>{pkg?.title ?? s.packageId}</strong>
                        <div
                          style={{
                            fontSize: "var(--font-size-caption)",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          EO: {pkg?.eoDisplayName ?? s.eoId}
                        </div>
                      </td>
                      <td>{baseVenueCapacity} Orang</td>
                      <td>
                        <strong>{s.capacity}</strong> Orang
                      </td>
                      <td>
                        <strong>{confirmedCount}</strong> Orang
                      </td>
                      <td>
                        <Badge tone={headroom > 5 ? "success" : "warning"}>
                          Sisa {headroom} Orang
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
