import { Fragment, useState } from "react";
import { Badge, Button } from "../../components/ui";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import { resolveAuthenticatedDestinationContext } from "./destinationContext";
import "./destination.css";

export function DestinationScheduleScreen() {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    null,
  );
  const context = resolveAuthenticatedDestinationContext();
  if (!context) {
    return (
      <div className="dest-container" style={{ padding: "var(--space-8)" }}>
        <div className="admin-alert admin-alert--warning">
          <h2>Data Jadwal Tidak Tersedia</h2>
          <p>
            Informasi jadwal operasional sesi tidak tersedia untuk akun ini.
          </p>
        </div>
      </div>
    );
  }

  const { destination } = context;
  const destinationIdentityId = destination.destinationId;

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
            Organizer di kawasan {destination?.name ?? "Anda"} (Read-Only).
            Alokasi kuota per sesi merupakan kapasitas trip yang dibuka EO,
            terpisah dari kapasitas umum destinasi.
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
                  <th>Ringkasan</th>
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

                  const isExpanded = expandedSessionId === s.sessionId;

                  return (
                    <Fragment key={s.sessionId}>
                      <tr>
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
                        <td>
                          {s.capacity} Orang
                          <div
                            style={{
                              fontSize: "var(--font-size-caption)",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            Kuota sesi EO
                          </div>
                        </td>
                        <td>
                          <strong>{confirmedCount}</strong> / {s.capacity} Orang
                          <div
                            style={{
                              fontSize: "var(--font-size-caption)",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            Peserta terkonfirmasi
                          </div>
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
                        <td>
                          <Button
                            type="button"
                            variant={isExpanded ? "primary" : "secondary"}
                            size="sm"
                            onClick={() =>
                              setExpandedSessionId(
                                isExpanded ? null : s.sessionId,
                              )
                            }
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? "Tutup" : "Lihat Ringkasan"}
                          </Button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="dest-session-summary-row">
                          <td colSpan={7}>
                            <div className="dest-session-summary-card">
                              <div className="dest-session-summary-header">
                                <strong className="dest-session-summary-title">
                                  Ringkasan Operasional Sesi
                                </strong>
                                <span className="dest-session-summary-id">
                                  ID Sesi: {s.sessionId}
                                </span>
                              </div>

                              <div className="dest-session-summary-grid">
                                <div className="dest-session-summary-item">
                                  <span className="dest-session-summary-label">
                                    Paket Experience
                                  </span>
                                  <strong className="dest-session-summary-val">
                                    {pkg?.title ?? s.packageId}
                                  </strong>
                                </div>

                                <div className="dest-session-summary-item">
                                  <span className="dest-session-summary-label">
                                    Penyelenggara (EO)
                                  </span>
                                  <strong className="dest-session-summary-val">
                                    {pkg?.eoDisplayName ?? s.eoId}
                                  </strong>
                                </div>

                                <div className="dest-session-summary-item">
                                  <span className="dest-session-summary-label">
                                    Waktu Pelaksanaan
                                  </span>
                                  <strong className="dest-session-summary-val">
                                    {dateLabel} WIB
                                  </strong>
                                </div>

                                <div className="dest-session-summary-item">
                                  <span className="dest-session-summary-label">
                                    Kuota Sesi EO
                                  </span>
                                  <strong className="dest-session-summary-val">
                                    {s.capacity} Orang
                                  </strong>
                                  <span className="dest-session-summary-hint">
                                    Kapasitas umum destinasi per sesi:{" "}
                                    {destination.capacityPerSession} orang
                                  </span>
                                </div>

                                <div className="dest-session-summary-item">
                                  <span className="dest-session-summary-label">
                                    Peserta Terkonfirmasi
                                  </span>
                                  <strong className="dest-session-summary-val">
                                    {confirmedCount} Orang
                                  </strong>
                                  <span className="dest-session-summary-hint">
                                    Selisih operasional:{" "}
                                    {Math.max(0, s.capacity - confirmedCount)}{" "}
                                    orang
                                  </span>
                                </div>

                                <div className="dest-session-summary-item">
                                  <span className="dest-session-summary-label">
                                    Status Sesi
                                  </span>
                                  <strong className="dest-session-summary-val">
                                    {s.status}
                                  </strong>
                                </div>

                                <div className="dest-session-summary-item">
                                  <span className="dest-session-summary-label">
                                    Sumber Pemandu Package
                                  </span>
                                  <strong className="dest-session-summary-val">
                                    {pkg?.guideSource === "DESTINATION"
                                      ? "Pemandu dari Destinasi"
                                      : "Pemandu dari EO (Certified Guide)"}
                                  </strong>
                                  <span className="dest-session-summary-hint">
                                    Pilihan sumber pemandu pada rancangan paket
                                  </span>
                                </div>
                              </div>

                              {s.operationalNote && (
                                <div
                                  style={{
                                    padding: "var(--space-3) var(--space-4)",
                                    background: "var(--color-bg-surface)",
                                    borderLeft:
                                      "3px solid var(--color-forest-700)",
                                    borderRadius:
                                      "0 var(--radius-md) var(--radius-md) 0",
                                  }}
                                >
                                  <span
                                    className="dest-session-summary-label"
                                    style={{
                                      fontWeight: 600,
                                      color: "var(--color-forest-900)",
                                    }}
                                  >
                                    Catatan Operasional Terbaru:
                                  </span>
                                  <p
                                    style={{
                                      margin: "var(--space-1) 0",
                                      fontSize: "var(--font-size-body-sm)",
                                      color: "var(--color-text-primary)",
                                      lineHeight: 1.45,
                                    }}
                                  >
                                    {s.operationalNote}
                                  </p>
                                  {s.operationalNoteUpdatedAt && (
                                    <span
                                      style={{
                                        fontSize: "var(--font-size-caption)",
                                        color: "var(--color-text-muted)",
                                      }}
                                    >
                                      Diperbarui:{" "}
                                      {new Date(
                                        s.operationalNoteUpdatedAt,
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

                              {pkg?.itinerary && pkg.itinerary.length > 0 && (
                                <div className="dest-session-summary-itinerary">
                                  <span className="dest-session-summary-label">
                                    Rencana Aktivitas ({pkg.itinerary.length}{" "}
                                    kegiatan):
                                  </span>
                                  <ol className="dest-session-summary-itinerary-list">
                                    {pkg.itinerary.map((item) => (
                                      <li key={item.order}>
                                        <strong>{item.title}</strong>
                                        {item.durationLabel &&
                                          ` (${item.durationLabel})`}
                                        {item.description &&
                                          ` — ${item.description}`}
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}

                              {pkg?.safetyNotes &&
                                pkg.safetyNotes.length > 0 && (
                                  <div className="dest-session-summary-safety">
                                    <span className="dest-session-summary-label">
                                      Catatan Keselamatan & Persiapan:
                                    </span>
                                    <ul className="dest-session-summary-safety-list">
                                      {pkg.safetyNotes.map((note, idx) => (
                                        <li key={idx}>{note}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
