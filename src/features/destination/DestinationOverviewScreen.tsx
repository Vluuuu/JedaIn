import { Link } from "react-router";
import { Badge } from "../../components/ui";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import { mockReviewStore } from "../reviews/mockReviewStore";
import "./destination.css";

export function DestinationOverviewScreen() {
  const partner = partnerSessionStore.get();
  const destinationIdentityId =
    partner?.destinationIdentityId ?? "dest_lereng_hijau";
  const destination = mockDestinationStore.getById(destinationIdentityId);

  // Find all packages using this destination
  const allPackages = mockEoPackageStore.getAllPackages();
  const venuePackages = allPackages.filter(
    (p) => p.destinationId === destinationIdentityId,
  );
  const venuePackageIds = new Set(venuePackages.map((p) => p.packageId));

  // Find all sessions using this venue
  const allSessions = mockEoPackageStore.getAllSessions();
  const venueSessions = allSessions.filter((s) =>
    venuePackageIds.has(s.packageId),
  );
  const openSessions = venueSessions.filter((s) => s.status === "OPEN");

  // Booked participants from shared transaction store
  const allBookings = mockTransactionStore.getBookings();
  const venueBookings = allBookings.filter(
    (b) =>
      venuePackageIds.has(b.packageId) &&
      (b.status === "PAID" || b.status === "COMPLETED"),
  );
  const confirmedParticipants = venueBookings.reduce(
    (sum, b) => sum + b.bookedQuantity,
    0,
  );

  // Reviews for this destination from shared review store
  const venueReviews = destination
    ? mockReviewStore.getReviewsForDestination(destination.name)
    : [];
  const avgRating =
    venueReviews.length > 0
      ? (
          venueReviews.reduce((sum, r) => sum + r.rating, 0) /
          venueReviews.length
        ).toFixed(1)
      : undefined;

  // Profile completeness calculation (6 explicit core fields)
  const checklist = [
    Boolean(destination?.name),
    Boolean(destination?.locationLabel),
    Boolean(destination?.description),
    Boolean(destination?.highlights && destination.highlights.length > 0),
    Boolean(
      destination?.baseCostPerPerson && destination.baseCostPerPerson > 0,
    ),
    Boolean(
      destination?.capacityPerSession && destination.capacityPerSession > 0,
    ),
  ];
  const completedItems = checklist.filter(Boolean).length;
  const totalItems = checklist.length;

  return (
    <div className="dest-container">
      <header className="dest-page-header">
        <div>
          <div
            style={{
              display: "flex",
              gap: "var(--space-2)",
              alignItems: "center",
              marginBottom: "var(--space-1)",
            }}
          >
            <Badge tone="success">Mitra Destinasi Terverifikasi</Badge>
            <Badge tone={destination?.guideReady ? "success" : "neutral"}>
              {destination?.guideReady ? "Guide Ready ✓" : "Non-Guide Ready"}
            </Badge>
          </div>
          <h1 className="dest-page-title">
            {destination?.name ?? "Kawasan Destinasi"}
          </h1>
          <p className="dest-page-subtitle">
            {destination?.locationLabel} • Pengelola:{" "}
            <strong>{partner?.businessName ?? "Pengelola Kawasan"}</strong>
          </p>
        </div>
      </header>

      {/* KPI Stats Grid */}
      <section
        className="dest-stats-grid"
        aria-label="Ringkasan operasional venue"
      >
        <div className="dest-stat-card">
          <span className="dest-stat-label">Sesi Jadwal Aktif</span>
          <strong className="dest-stat-value">{openSessions.length}</strong>
          <span className="dest-stat-desc">Dijadwalkan oleh mitra EO</span>
        </div>

        <div className="dest-stat-card">
          <span className="dest-stat-label">Peserta Terkonfirmasi</span>
          <strong className="dest-stat-value">{confirmedParticipants}</strong>
          <span className="dest-stat-desc">Total traveler berkunjung</span>
        </div>

        <div className="dest-stat-card">
          <span className="dest-stat-label">Kapasitas Maksimal Venue</span>
          <strong className="dest-stat-value">
            {destination?.capacityPerSession ?? 20}
          </strong>
          <span className="dest-stat-desc">Batas orang / sesi tenang</span>
        </div>

        <div className="dest-stat-card">
          <span className="dest-stat-label">Rating Ulasan Destinasi</span>
          <strong
            className="dest-stat-value"
            style={{ color: "var(--color-sand-700)" }}
          >
            {avgRating ? `★ ${avgRating}` : "—"}
          </strong>
          <span className="dest-stat-desc">
            {venueReviews.length > 0
              ? `${venueReviews.length} ulasan traveler`
              : "Belum ada ulasan"}
          </span>
        </div>
      </section>

      {/* Profile Completeness & Status Highlight */}
      <section className="eo-banner-card" aria-label="Kelengkapan profil">
        <div className="eo-banner-content">
          <Badge tone="info">Kelengkapan Informasi Kawasan</Badge>
          <h2 style={{ margin: "var(--space-1) 0" }}>
            {completedItems}/{totalItems} Informasi Inti Lengkap
          </h2>
          <p style={{ margin: 0 }}>
            Profil destinasi telah memenuhi standar kurasi ketenangan, fasilitas
            air bersih, dan SOP pemandu JedaIn.
          </p>
        </div>
        <Link
          to="/partner/destination/profile"
          style={{
            color: "var(--color-brand-primary)",
            fontWeight: 600,
            fontSize: "var(--font-size-body-sm)",
            textDecoration: "underline",
          }}
        >
          Lihat Profil Lengkap &rarr;
        </Link>
      </section>

      {/* Upcoming Sessions Using Venue Table */}
      <section className="eo-section" aria-label="Jadwal trip EO di lokasi">
        <div className="eo-section-header">
          <div>
            <h2 className="eo-section-title">Jadwal Sesi EO di Lokasi Anda</h2>
            <p
              style={{
                margin: 0,
                fontSize: "var(--font-size-caption)",
                color: "var(--color-text-secondary)",
              }}
            >
              Pantau jadwal trip yang diselenggarakan oleh mitra EO di kawasan
              Anda.
            </p>
          </div>
          <Link
            to="/partner/destination/schedule"
            style={{
              fontSize: "var(--font-size-body-sm)",
              color: "var(--color-brand-primary)",
              fontWeight: 600,
            }}
          >
            Lihat Jadwal Lengkap &rarr;
          </Link>
        </div>

        {venueSessions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-6)",
              color: "var(--color-text-muted)",
            }}
          >
            Belum ada sesi perjalanan EO yang dijadwalkan di lokasi ini.
          </div>
        ) : (
          <div className="eo-table-wrapper">
            <table className="eo-table">
              <thead>
                <tr>
                  <th>Paket Experience</th>
                  <th>Penyelenggara (EO)</th>
                  <th>Waktu Pelaksanaan</th>
                  <th>Alokasi Peserta</th>
                  <th>Status Sesi</th>
                </tr>
              </thead>
              <tbody>
                {venueSessions.map((s) => {
                  const pkg = venuePackages.find(
                    (p) => p.packageId === s.packageId,
                  );
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
                      </td>
                      <td>{pkg?.eoDisplayName ?? s.eoId}</td>
                      <td>{dateLabel} WIB</td>
                      <td>{s.capacity} Orang</td>
                      <td>
                        <Badge
                          tone={s.status === "OPEN" ? "success" : "neutral"}
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
