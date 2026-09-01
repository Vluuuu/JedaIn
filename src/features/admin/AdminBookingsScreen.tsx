import { Badge } from "../../components/ui";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { MOCK_PACKAGE_DETAILS } from "../packageDetail/mockPackageDetails";
import "./admin.css";

export function AdminBookingsScreen() {
  // Read directly from shared transaction store
  const allBookings = mockTransactionStore.getBookings();

  return (
    <div className="admin-container">
      <header className="admin-page-header">
        <div>
          <Badge tone="info">Audit Transaksi</Badge>
          <h1
            className="admin-page-title"
            style={{ marginTop: "var(--space-2)" }}
          >
            Inspeksi Transaksi & Pembayaran Traveler
          </h1>
          <p className="admin-page-subtitle">
            Tinjau status transaksi riil dari shared transaction store tanpa
            kontrol mutasi finansial manual.
          </p>
        </div>
      </header>

      <section className="admin-section" aria-label="Daftar transaksi sistem">
        {allBookings.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-8)",
              color: "var(--color-text-muted)",
            }}
          >
            <p>Belum ada transaksi traveler yang tercatat di sistem.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>No. Booking</th>
                  <th>Paket Experience</th>
                  <th>Sesi Jadwal</th>
                  <th>Jumlah Peserta</th>
                  <th>Total Terbayar</th>
                  <th>Status Transaksi</th>
                  <th>Waktu Booking</th>
                </tr>
              </thead>
              <tbody>
                {allBookings.map((b) => {
                  const pkgDetail = MOCK_PACKAGE_DETAILS[b.packageId];
                  const session = pkgDetail?.upcomingSessionPreviews?.find(
                    (s) => s.sessionId === b.sessionId,
                  );

                  const sessionLabel = session?.startAt
                    ? new Date(session.startAt).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : b.sessionId;

                  return (
                    <tr key={b.bookingId}>
                      <td>
                        <strong>{b.bookingId}</strong>
                      </td>
                      <td>
                        {pkgDetail ? b.packageId : b.packageId}
                        <div
                          style={{
                            fontSize: "var(--font-size-caption)",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          Traveler: {b.travelerId}
                        </div>
                      </td>
                      <td>{sessionLabel}</td>
                      <td>
                        <strong>{b.participantCount}</strong> Orang
                      </td>
                      <td>Rp{b.totalAmount.toLocaleString("id-ID")}</td>
                      <td>
                        <Badge
                          tone={
                            b.status === "PAID" || b.status === "COMPLETED"
                              ? "success"
                              : b.status === "PENDING_PAYMENT"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {b.status}
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
