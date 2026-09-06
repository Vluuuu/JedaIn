import { useNavigate, useParams, Link } from "react-router";
import { ArrowLeftIcon } from "../../components/shells/icons";
import { Badge, Button } from "../../components/ui";
import { mockDestinationStore } from "./mockDestinationStore";
import "./eo.css";

export function EoDestinationDetailScreen() {
  const { destinationId } = useParams<{ destinationId: string }>();
  const navigate = useNavigate();

  const destination = destinationId
    ? mockDestinationStore.getById(destinationId)
    : undefined;

  if (!destination) {
    return (
      <div className="eo-dest-detail-container">
        <div className="eo-dest-detail-empty">
          <h2>Destinasi Tidak Ditemukan</h2>
          <p>Destinasi yang Anda cari tidak tersedia atau belum terdaftar.</p>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate("/partner/eo/destinations")}
          >
            Kembali ke Direktori Destinasi
          </Button>
        </div>
      </div>
    );
  }

  const handleCreatePackage = () => {
    navigate(
      `/partner/eo/packages/new?destinationId=${destination.destinationId}`,
    );
  };

  return (
    <div className="eo-dest-detail-container">
      {/* 1. Back Navigation */}
      <nav className="eo-dest-detail-back-nav" aria-label="Navigasi kembali">
        <Link
          to="/partner/eo/destinations"
          className="eo-dest-detail-back-link"
        >
          <ArrowLeftIcon className="eo-dest-detail-back-icon" />
          <span>Kembali ke Destinasi</span>
        </Link>
      </nav>

      {/* 2. Hero / Destination Identity */}
      <header className="eo-dest-detail-hero">
        <div className="eo-dest-detail-hero__media">
          {destination.imageUrl ? (
            <img
              src={destination.imageUrl}
              alt={destination.name}
              className="eo-dest-detail-hero__img"
            />
          ) : (
            <div className="eo-dest-detail-hero__placeholder" />
          )}
        </div>

        <div className="eo-dest-detail-hero__content">
          <div className="eo-dest-detail-hero__badges">
            <Badge
              tone={
                destination.verificationLevel === "PLUS" ? "info" : "success"
              }
            >
              {destination.verificationLevel === "PLUS"
                ? "Terverifikasi Plus"
                : "Terverifikasi Dasar"}
            </Badge>
            <span className="eo-dest-detail-hero__guide-badge">
              🌿 Pemandu lokal tersedia
            </span>
          </div>

          <h1 className="eo-dest-detail-hero__title">{destination.name}</h1>
          <p className="eo-dest-detail-hero__loc">
            {destination.locationLabel}
          </p>

          <div className="eo-dest-detail-hero__pricing-row">
            <div>
              <span className="eo-dest-detail-hero__price-label">
                Biaya dasar destinasi
              </span>
              <strong className="eo-dest-detail-hero__price-val">
                Rp{destination.baseCostPerPerson.toLocaleString("id-ID")}{" "}
                <small>/ orang</small>
              </strong>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleCreatePackage}
            >
              Buat Paket dengan Destinasi Ini &rarr;
            </Button>
          </div>
        </div>
      </header>

      {/* 3. Detail Grid: Main & Side */}
      <div className="eo-dest-detail-grid">
        {/* Main Column */}
        <div className="eo-dest-detail-main">
          {/* Tentang Destinasi */}
          <section className="eo-dest-detail-card">
            <h2 className="eo-dest-detail-card__title">Tentang Destinasi</h2>
            <p className="eo-dest-detail-card__text">
              {destination.description}
            </p>

            {destination.highlights && destination.highlights.length > 0 && (
              <div className="eo-dest-detail-highlights">
                <strong className="eo-dest-subheading">
                  Karakteristik Utama:
                </strong>
                <ul>
                  {destination.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Aktivitas yang Tersedia */}
          {destination.availableActivities && (
            <section className="eo-dest-detail-card">
              <h2 className="eo-dest-detail-card__title">
                Aktivitas yang Tersedia
              </h2>
              <p className="eo-dest-detail-card__hint">
                Inspirasi aktivitas yang dapat Anda adaptasi ke dalam alur
                itinerary pengalaman:
              </p>
              <ul className="eo-dest-detail-bullet-list">
                {destination.availableActivities.map((act, i) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Fasilitas */}
          {destination.facilities && (
            <section className="eo-dest-detail-card">
              <h2 className="eo-dest-detail-card__title">
                Fasilitas di Lokasi
              </h2>
              <ul className="eo-dest-detail-facility-grid">
                {destination.facilities.map((fac, i) => (
                  <li key={i} className="eo-dest-facility-item">
                    ✓ {fac}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Catatan Operasional */}
          {destination.operationalNotes && (
            <section className="eo-dest-detail-card">
              <h2 className="eo-dest-detail-card__title">
                Catatan Operasional
              </h2>
              <ul className="eo-dest-detail-bullet-list">
                {destination.operationalNotes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Side Column */}
        <aside className="eo-dest-detail-side">
          {/* Pemandu Lokal */}
          <div className="eo-dest-side-card">
            <h3 className="eo-dest-side-title">Pemanduan Lokal</h3>
            <p className="eo-dest-side-text">
              {destination.localGuideSummary ??
                "Mitra destinasi menyediakan pemandu lokal terlatih untuk mendampingi alur trip di lokasi."}
            </p>
            <div className="eo-dest-side-badge-box">
              <span className="eo-dest-badge-ready">Pemandu Lokal Siap</span>
            </div>
          </div>

          {/* Kapasitas & Operasional */}
          <div className="eo-dest-side-card">
            <h3 className="eo-dest-side-title">Kapasitas Sesi</h3>
            <div className="eo-dest-spec-row">
              <span className="eo-dest-spec-label">Maksimal per sesi</span>
              <strong className="eo-dest-spec-val">
                {destination.capacityPerSession} peserta
              </strong>
            </div>
            <div className="eo-dest-spec-row">
              <span className="eo-dest-spec-label">Area / Kota</span>
              <span className="eo-dest-spec-val">
                {destination.city}, {destination.province}
              </span>
            </div>
          </div>

          {/* Action Card */}
          <div className="eo-dest-side-cta-card">
            <h3 className="eo-dest-side-cta-title">Siap merancang paket?</h3>
            <p className="eo-dest-side-cta-desc">
              Buka Trip Builder dengan destinasi ini sebagai dasar alur
              pengalaman.
            </p>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleCreatePackage}
            >
              Buat Paket Sekarang
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
