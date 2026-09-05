import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeftIcon } from "../../components/shells/icons";
import { Badge, Button } from "../../components/ui";
import { getPackageVisual } from "../../lib/assets/packageImages";
import { mockDestinationStore } from "./mockDestinationStore";
import { mockEoPackageStore } from "./mockEoPackageStore";
import { mockInsightStore } from "./mockInsightStore";
import { partnerSessionStore } from "./partnerSessionStore";
import { getHumanStatusLabel, getStatusBadgeTone } from "./packageHelpers";
import "./eo.css";

export function EoPackageDetailScreen() {
  const { packageId } = useParams<{ packageId: string }>();
  const navigate = useNavigate();
  const partner = partnerSessionStore.get();
  const eoId = partner?.id ?? "eo_jeda_alam";
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Ownership verification
  const pkg = packageId
    ? mockEoPackageStore.getPackageForEo(packageId, eoId)
    : undefined;

  if (!pkg) {
    return (
      <div className="eo-pkg-detail-container">
        <div className="eo-pkg-detail-empty">
          <h2>Paket Tidak Ditemukan</h2>
          <p>
            Rancangan paket ini tidak tersedia atau bukan milik akun EO Anda.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate("/partner/eo/packages")}
          >
            Kembali ke Daftar Paket
          </Button>
        </div>
      </div>
    );
  }

  const destination = mockDestinationStore.getById(pkg.destinationId);
  const insight = pkg.insightId
    ? mockInsightStore.getInsightById(pkg.insightId)
    : undefined;

  const pkgSessions = mockEoPackageStore.getSessionsByPackage(pkg.packageId);
  const openSessionsCount = pkgSessions.filter(
    (s) => s.status === "OPEN",
  ).length;

  const handlePublishLive = () => {
    setPublishError(null);
    setPublishMessage(null);
    const res = mockEoPackageStore.publishApprovedPackage(pkg.packageId);
    if (res.success) {
      setPublishMessage(
        "Paket berhasil dipublikasikan LIVE ke Marketplace Traveler!",
      );
    } else {
      setPublishError(res.message ?? "Gagal mempublikasikan paket.");
    }
  };

  return (
    <div className="eo-pkg-detail-container">
      {/* 1. Back navigation with SVG icon */}
      <nav className="eo-pkg-detail-back-nav" aria-label="Navigasi kembali">
        <Link to="/partner/eo/packages" className="eo-pkg-detail-back-link">
          <ArrowLeftIcon className="eo-pkg-detail-back-icon" />
          <span>Kembali ke Daftar Paket</span>
        </Link>
      </nav>

      {/* Alerts */}
      {publishMessage && (
        <div className="eo-alert eo-alert--success" role="status">
          {publishMessage}
        </div>
      )}

      {publishError && (
        <div className="eo-alert eo-alert--error" role="alert">
          {publishError}
        </div>
      )}

      {/* 2. Detail Header: Title, Value Prop, Metadata & Actions */}
      <header className="eo-pkg-detail-header">
        <div
          className="eo-pkg-detail-header__visual"
          style={{
            backgroundImage: `url("${getPackageVisual(pkg.packageId, destination?.name).svgDataUri}")`,
          }}
          role="img"
          aria-label={`Ilustrasi suasana ${pkg.title}`}
        >
          <div
            className="eo-pkg-detail-header__visual-scrim"
            aria-hidden="true"
          />
        </div>

        <div className="eo-pkg-detail-header__main">
          <div className="eo-pkg-detail-header__meta">
            <Badge tone={getStatusBadgeTone(pkg.status)}>
              {getHumanStatusLabel(pkg.status)}
            </Badge>
            <span className="eo-pkg-detail-header__dot" aria-hidden="true">
              ·
            </span>
            <span className="eo-pkg-detail-header__duration">
              {pkg.durationLabel}
            </span>
            {destination && (
              <>
                <span className="eo-pkg-detail-header__dot" aria-hidden="true">
                  ·
                </span>
                <span className="eo-pkg-detail-header__dest">
                  {destination.name}
                </span>
              </>
            )}
          </div>

          <h1 className="eo-pkg-detail-title">{pkg.title}</h1>
          <p className="eo-pkg-detail-subtitle">
            {pkg.valueProposition || pkg.shortSummary}
          </p>
        </div>

        {/* State-specific primary header actions */}
        <div className="eo-pkg-detail-header__actions">
          {pkg.status === "APPROVED" && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handlePublishLive}
            >
              Publish ke Marketplace
            </Button>
          )}

          {(pkg.status === "APPROVED" || pkg.status === "LIVE") && (
            <Button
              type="button"
              variant={pkg.status === "APPROVED" ? "secondary" : "primary"}
              size="md"
              onClick={() =>
                navigate(`/partner/eo/packages/${pkg.packageId}/sessions`)
              }
            >
              Atur Jadwal Sesi &rarr;
            </Button>
          )}

          {pkg.status === "DRAFT" && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() =>
                navigate(`/partner/eo/packages/new?draftId=${pkg.packageId}`)
              }
            >
              Lanjut Edit Draf &rarr;
            </Button>
          )}

          {pkg.status === "REJECTED" && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() =>
                navigate(`/partner/eo/packages/new?draftId=${pkg.packageId}`)
              }
            >
              Perbaiki & Ajukan Ulang &rarr;
            </Button>
          )}
        </div>
      </header>

      {/* 3. Status Callout / Banner */}
      {pkg.status === "PENDING_ADMIN_REVIEW" && (
        <section
          className="eo-alert eo-alert--warning"
          aria-label="Status peninjauan kurator"
        >
          <strong>Sedang ditinjau Admin JedaIn</strong>
          <p>
            Paket ini telah lolos validasi teknis dan diajukan pada{" "}
            {pkg.submittedAt
              ? new Date(pkg.submittedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "hari ini"}
            . Setelah disetujui Admin, status akan menjadi Disetujui dan kamu
            dapat membuka jadwal sesi penjualan.
          </p>
        </section>
      )}

      {pkg.status === "REJECTED" && (
        <section
          className="eo-alert eo-alert--error"
          aria-label="Catatan perbaikan kurator"
        >
          <strong>Catatan Perbaikan dari Kurator Admin:</strong>
          <p>
            {pkg.rejectionReason ??
              "Mohon perjelas rincian durasi waktu pada setiap sesi aktivitas itinerary."}
          </p>
        </section>
      )}

      {pkg.status === "LIVE" && (
        <section
          className="eo-alert eo-alert--success"
          aria-label="Informasi paket tayang"
        >
          <strong>Paket Sedang Tayang (Live)</strong>
          <p>
            Paket ini aktif dan dapat dipesan oleh traveler di Marketplace. Saat
            ini terdapat {openSessionsCount} jadwal keberangkatan mendatang.
          </p>
        </section>
      )}

      {/* 4. Two-Column Information Architecture: Main (65%) & Side (35%) */}
      <div className="eo-pkg-detail-grid">
        {/* MAIN COLUMN */}
        <div className="eo-pkg-detail-main">
          {/* Itinerary */}
          <section className="eo-pkg-detail-section">
            <h2 className="eo-pkg-detail-section-title">
              Alur Itinerary Pengalaman
            </h2>
            <div className="eo-itinerary-list">
              {pkg.itinerary.map((item) => (
                <div key={item.order} className="eo-itinerary-item">
                  <div className="eo-itinerary-item__header">
                    <strong>
                      #{item.order} {item.title}
                    </strong>
                    {item.durationLabel && (
                      <Badge tone="neutral">{item.durationLabel}</Badge>
                    )}
                  </div>
                  <p className="eo-itinerary-item__desc">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Ketentuan & Fasilitas */}
          <section className="eo-pkg-detail-section">
            <h2 className="eo-pkg-detail-section-title">
              Ketentuan & Fasilitas
            </h2>
            <div className="eo-pkg-provisions-grid">
              <div className="eo-pkg-provision-box">
                <strong className="eo-pkg-provision-title eo-pkg-provision-title--included">
                  Sudah Termasuk:
                </strong>
                <ul className="eo-pkg-provision-list">
                  {pkg.includedItems.map((inc, i) => (
                    <li key={i}>{inc}</li>
                  ))}
                </ul>
              </div>

              <div className="eo-pkg-provision-box">
                <strong className="eo-pkg-provision-title eo-pkg-provision-title--excluded">
                  Belum Termasuk:
                </strong>
                <ul className="eo-pkg-provision-list">
                  {pkg.excludedItems.map((exc, i) => (
                    <li key={i}>{exc}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Safety & Preparation */}
          {pkg.safetyNotes && pkg.safetyNotes.length > 0 && (
            <section className="eo-pkg-detail-section">
              <h2 className="eo-pkg-detail-section-title">
                Catatan Keselamatan & Persiapan
              </h2>
              <ul className="eo-pkg-safety-list">
                {pkg.safetyNotes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* SIDE COLUMN */}
        <aside className="eo-pkg-detail-side">
          {/* Pricing Breakdown: Humanized terms */}
          <section className="eo-pkg-side-card">
            <h3 className="eo-pkg-side-title">Rincian Harga</h3>
            <div className="eo-pkg-price-table">
              <div className="eo-pkg-price-row">
                <span className="eo-pkg-price-label">
                  Biaya dasar destinasi
                </span>
                <strong className="eo-pkg-price-val">
                  Rp{pkg.pricing.destinationBaseCost.toLocaleString("id-ID")}
                </strong>
              </div>
              <div className="eo-pkg-price-row">
                <span className="eo-pkg-price-label">Margin EO</span>
                <strong className="eo-pkg-price-val">
                  Rp{pkg.pricing.eoMargin.toLocaleString("id-ID")}
                </strong>
              </div>
              <div className="eo-pkg-price-row eo-pkg-price-row--total">
                <span className="eo-pkg-price-label">Harga traveler</span>
                <span className="eo-pkg-price-total">
                  Rp{pkg.pricing.customerPrice.toLocaleString("id-ID")}
                  <small> / orang</small>
                </span>
              </div>
            </div>
          </section>

          {/* Destination Context */}
          {destination && (
            <section className="eo-pkg-side-card">
              <h3 className="eo-pkg-side-title">Lokasi Destinasi</h3>
              {destination.imageUrl && (
                <div className="eo-pkg-dest-thumb">
                  <img
                    src={destination.imageUrl}
                    alt={destination.name}
                    className="eo-pkg-dest-img"
                  />
                </div>
              )}
              <div className="eo-pkg-dest-info">
                <h4 className="eo-pkg-dest-name">{destination.name}</h4>
                <p className="eo-pkg-dest-loc">{destination.locationLabel}</p>

                <div className="eo-pkg-dest-guide-state">
                  <Badge tone={destination.guideReady ? "success" : "neutral"}>
                    {destination.guideReady ? "Guide Ready" : "Non-Guide Ready"}
                  </Badge>
                  <p className="eo-pkg-guide-expl">
                    {destination.guideReady
                      ? "Pemandu lokal tersedia dari destinasi"
                      : partner?.guideStatus === "CERTIFIED_GUIDE"
                        ? "Pemanduan dapat disiapkan oleh EO bersertifikat"
                        : "Perlu konfirmasi pemandu mandiri"}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Insight Context (if source-backed) */}
          {insight && (
            <section className="eo-pkg-side-card">
              <span className="eo-pkg-insight-eyebrow">
                Dibuat dari Insight Traveler
              </span>
              <h4 className="eo-pkg-insight-title">{insight.title}</h4>
              <p className="eo-pkg-insight-desc">
                {insight.unmetDemandDescription}
              </p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
