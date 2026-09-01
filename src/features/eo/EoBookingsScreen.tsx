import { Badge } from "../../components/ui";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { MOCK_PACKAGE_DETAILS } from "../packageDetail/mockPackageDetails";
import { mockEoPackageStore } from "./mockEoPackageStore";
import { partnerSessionStore } from "./partnerSessionStore";
import "./eo.css";

export function EoBookingsScreen() {
  const partner = partnerSessionStore.get();
  const eoId = partner?.id ?? "eo_jeda_alam";

  const packages = mockEoPackageStore.getPackagesByEo(eoId);
  const eoPackageIds = new Set(packages.map((p) => p.packageId));

  // Filter bookings from shared transaction store that belong to this EO's packages
  const allBookings = mockTransactionStore.getBookings();
  const eoBookings = allBookings.filter((b) => eoPackageIds.has(b.packageId));
  const allSessions = mockEoPackageStore.getAllSessions();

  return (
    <div className="eo-container">
      <header className="eo-page-header">
        <div>
          <Badge tone="info">Operasional Pemesanan</Badge>
          <h1 className="eo-page-title" style={{ marginTop: "var(--space-2)" }}>
            Daftar Booking & Peserta
          </h1>
          <p className="eo-page-subtitle">
            Pantau status transaksi traveler, jadwal sesi keberangkatan, dan
            kesiapan operasional peserta.
          </p>
        </div>
      </header>

      {/* Bookings Table */}
      <section className="eo-section" aria-label="Tabel pesanan traveler">
        {eoBookings.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-8)",
              color: "var(--color-text-muted)",
            }}
          >
            <p>
              Belum ada transaksi pemesanan masuk untuk paket-paket milikmu.
            </p>
          </div>
        ) : (
          <div className="eo-table-wrapper">
            <table className="eo-table">
              <thead>
                <tr>
                  <th>No. Pesanan</th>
                  <th>Paket Experience</th>
                  <th>Jadwal Sesi Trip</th>
                  <th>Jumlah Peserta</th>
                  <th>Total Pembayaran</th>
                  <th>Status Transaksi</th>
                  <th>Tanggal Booking</th>
                </tr>
              </thead>
              <tbody>
                {eoBookings.map((b) => {
                  const pkg = packages.find((p) => p.packageId === b.packageId);
                  const isPaid =
                    b.status === "PAID" || b.status === "COMPLETED";

                  // Resolve session date from centralized session source or package details
                  const foundSession =
                    allSessions.find((s) => s.sessionId === b.sessionId) ??
                    MOCK_PACKAGE_DETAILS[
                      b.packageId
                    ]?.upcomingSessionPreviews?.find(
                      (s) => s.sessionId === b.sessionId,
                    );

                  const sessionDateLabel = foundSession?.startAt
                    ? new Date(foundSession.startAt).toLocaleDateString(
                        "id-ID",
                        {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )
                    : b.sessionId;

                  return (
                    <tr key={b.bookingId}>
                      <td>
                        <strong>{b.bookingId}</strong>
                      </td>
                      <td>{pkg?.title ?? b.packageId}</td>
                      <td>
                        <strong>{sessionDateLabel}</strong>
                        <div
                          style={{
                            fontSize: "var(--font-size-caption)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          Sesi: {b.sessionId}
                        </div>
                      </td>
                      <td>
                        <strong>{b.participantCount}</strong> Orang
                      </td>
                      <td>Rp{b.totalAmount.toLocaleString("id-ID")}</td>
                      <td>
                        <Badge
                          tone={
                            isPaid
                              ? "success"
                              : b.status === "PENDING_PAYMENT"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {b.status === "PAID"
                            ? "Terkonfirmasi"
                            : b.status === "PENDING_PAYMENT"
                              ? "Menunggu Bayar"
                              : b.status}
                        </Badge>
                      </td>
                      <td>
                        {new Date(b.createdAt).toLocaleDateString("id-ID")}
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
