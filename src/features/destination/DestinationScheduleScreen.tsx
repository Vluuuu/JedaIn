import { Badge } from "../../components/ui";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import "./destination.css";

export function DestinationScheduleScreen() {
  const partner = partnerSessionStore.get();
  const destinationIdentityId =
    partner?.destinationIdentityId ?? "dest_lereng_hijau";

  // Filter only packages designed at this venue
  const allPackages = mockEoPackageStore.getAllPackages();
  const venuePackages = allPackages.filter(
    (p) => p.destinationId === destinationIdentityId,
  );
  const venuePackageIds = new Set(venuePackages.map((p) => p.packageId));

  // Filter sessions that belong to packages at this venue
  const allSessions = mockEoPackageStore.getAllSessions();
  const venueSessions = allSessions.filter((s) =>
    venuePackageIds.has(s.packageId),
  );

  // Bookings from shared transaction store
  const allBookings = mockTransactionStore.getBookings();

  return (
    <div className="dest-container">
      <header className="dest-page-header">
        <div>
          <Badge tone="info">Jadwal Operasional Venue</Badge>
          <h1
            className="dest-page-title"
            style={{ marginTop: "var(--space-2)" }}
          >
            Jadwal Sesi Perjalanan di Lokasi
          </h1>
          <p className="dest-page-subtitle">
            Daftar sesi perjalanan yang diselenggarakan oleh mitra Event
            Organizer di kawasan Anda (Read-Only).
          </p>
        </div>
      </header>

      {/* Schedule Table (DP08) */}
      <section className="eo-section" aria-label="Tabel jadwal sesi venue">
        {venueSessions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-8)",
              color: "var(--color-text-muted)",
            }}
          >
            <p>
              Belum ada sesi perjalanan EO yang dijadwalkan di kawasan Anda.
            </p>
          </div>
        ) : (
          <div className="eo-table-wrapper">
            <table className="eo-table">
              <thead>
                <tr>
                  <th>Paket Experience</th>
                  <th>Penyelenggara (EO)</th>
                  <th>Waktu Pelaksanaan</th>
                  <th>Alokasi Kapasitas</th>
                  <th>Peserta Terkonfirmasi</th>
                  <th>Status Sesi</th>
                </tr>
              </thead>
              <tbody>
                {venueSessions.map((s) => {
                  const pkg = venuePackages.find(
                    (p) => p.packageId === s.packageId,
                  );

                  // Calculate confirmed booked participants from shared transaction store
                  const confirmedCount = allBookings
                    .filter(
                      (b) =>
                        b.sessionId === s.sessionId &&
                        (b.status === "PAID" || b.status === "COMPLETED"),
                    )
                    .reduce((sum, b) => sum + b.bookedQuantity, 0);

                  const dateLabel = new Date(s.startAt).toLocaleString(
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
                        <strong>{pkg?.title ?? s.packageId}</strong>
                        <div
                          style={{
                            fontSize: "var(--font-size-caption)",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          Sesi: {s.sessionId}
                        </div>
                      </td>
                      <td>{pkg?.eoDisplayName ?? s.eoId}</td>
                      <td>{dateLabel} WIB</td>
                      <td>{s.capacity} Orang</td>
                      <td>
                        <strong>{confirmedCount}</strong> / {s.capacity} Orang
                      </td>
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
