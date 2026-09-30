import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router";
import { destinationRepository } from "../../data/destinationRepository";
import { ArrowLeftIcon } from "../../components/shells/icons";
import { Button } from "../../components/ui";
import { getDestinationVisual } from "../../lib/assets/packageImages";
import { useRealtimeSubscription } from "../../lib/supabase/realtime";
import { mockDestinationStore } from "./mockDestinationStore";
import type { DestinationRecord } from "./types";
import "./eo.css";

export function EoDestinationDetailScreen() {
  const { destinationId } = useParams<{ destinationId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const openedFromBuilder = searchParams.get("from") === "builder";
  const builderDraftId = searchParams.get("draftId");

  const [destination, setDestination] = useState<DestinationRecord | undefined>(
    () =>
      destinationId ? mockDestinationStore.getById(destinationId) : undefined,
  );

  useEffect(() => {
    let isMounted = true;
    if (destinationId) {
      destinationRepository.getById(destinationId).then((res) => {
        if (isMounted && res) {
          setDestination(res);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [destinationId]);

  useRealtimeSubscription("destinations", () => {
    if (destinationId) {
      destinationRepository.getById(destinationId).then((res) => {
        if (res) setDestination(res);
      });
    }
  });

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

  const isEligible =
    destination.status === "ACTIVE" && destination.guideReady === true;

  const builderReturnParams = new URLSearchParams();
  if (builderDraftId) builderReturnParams.set("draftId", builderDraftId);

  const builderBackTarget = builderDraftId
    ? `/partner/eo/packages/new?${builderReturnParams.toString()}`
    : "/partner/eo/packages/new";

  const handleCreatePackage = () => {
    if (!isEligible) return;
    const params = new URLSearchParams({
      destinationId: destination.destinationId,
    });
    if (builderDraftId) params.set("draftId", builderDraftId);
    navigate(`/partner/eo/packages/new?${params.toString()}`);
  };

  return (
    <div className="eo-dest-detail-container">
      {/* 1. Back Navigation */}
      <nav className="eo-dest-detail-back-nav" aria-label="Navigasi kembali">
        <Link
          to={
            openedFromBuilder ? builderBackTarget : "/partner/eo/destinations"
          }
          className="eo-dest-detail-back-link"
        >
          <ArrowLeftIcon className="eo-dest-detail-back-icon" />
          <span>
            {openedFromBuilder
              ? "Kembali ke Perancang Paket"
              : "Kembali ke Destinasi"}
          </span>
        </Link>
      </nav>

      {/* 2. Hero / Destination Identity */}
      <header className="eo-dest-detail-hero">
        <div className="eo-dest-detail-hero__media">
          <img
            src={
              destination.imageUrl ||
              getDestinationVisual(destination.name).svgDataUri
            }
            alt={destination.name}
            className="eo-dest-detail-hero__img"
          />
        </div>

        <div className="eo-dest-detail-hero__content">
          <h1 className="eo-dest-detail-hero__title">{destination.name}</h1>

          <p>
            {isEligible
              ? "Destinasi ini telah melalui proses verifikasi JedaIn."
              : "Destinasi belum tersedia untuk perancangan paket Travel Organizer."}
          </p>

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
            <div>
              <span className="eo-dest-detail-hero__price-label">
                Tarif pemandu lokal
              </span>
              <strong className="eo-dest-detail-hero__price-val">
                Rp
                {(destination.localGuideFeePerPerson ?? 0).toLocaleString(
                  "id-ID",
                )}{" "}
                <small>/ orang</small>
              </strong>
            </div>

            {isEligible ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleCreatePackage}
              >
                Buat Paket dengan Destinasi Ini &rarr;
              </Button>
            ) : (
              <Button type="button" variant="secondary" size="md" disabled>
                Belum Memenuhi Syarat Paket
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Galeri Destinasi */}
      {(() => {
        const destMedia =
          destination.mediaGallery?.filter(
            (media) => (media.category ?? "DESTINATION") === "DESTINATION",
          ) ?? [];
        if (destMedia.length === 0) return null;
        return (
          <section
            className="eo-dest-media-gallery"
            aria-label="Galeri Destinasi"
          >
            <div className="eo-dest-media-gallery__header">
              <div>
                <h2>Galeri Destinasi</h2>
                <p>
                  Pilih visual ini sebagai referensi package. Visual berlabel
                  prototype bukan foto kondisi aktual destinasi.
                </p>
              </div>
              <span>{destMedia.length} visual</span>
            </div>
            <div className="eo-dest-media-gallery__grid">
              {destMedia.map((media) => (
                <figure
                  key={media.mediaId}
                  className="eo-dest-media-gallery__item"
                >
                  <img src={media.url} alt={media.label} />
                  <figcaption>
                    <strong>{media.label}</strong>
                    <span>
                      {media.provenance === "PROTOTYPE_ILLUSTRATION"
                        ? "Visual prototype"
                        : "Ditambahkan Mitra Destinasi"}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Foto Fasilitas - Grouped by Facility */}
      {(() => {
        const facMedia =
          destination.mediaGallery?.filter(
            (media) => media.category === "FACILITY",
          ) ?? [];
        const facilities = destination.facilities ?? [];
        if (facMedia.length === 0 && facilities.length === 0) return null;

        return (
          <section
            className="eo-dest-media-gallery"
            aria-label="Foto Fasilitas"
          >
            <div className="eo-dest-media-gallery__header">
              <div>
                <h2>Foto Fasilitas</h2>
                <p>
                  Foto fasilitas yang tercatat di destinasi ini untuk gambaran
                  operasional Travel Organizer.
                </p>
              </div>
              <span>{facMedia.length} foto</span>
            </div>

            <div className="eo-dest-facility-grouped-list">
              {facilities.map((fac) => {
                const photos = facMedia.filter(
                  (m) =>
                    m.facilityLabel === fac ||
                    (!m.facilityLabel &&
                      m.label.toLowerCase().includes(fac.toLowerCase())),
                );
                return (
                  <div key={fac} className="eo-dest-facility-group">
                    <h3 className="eo-dest-facility-group__title">{fac}</h3>
                    {photos.length > 0 ? (
                      <div className="eo-dest-media-gallery__grid">
                        {photos.map((media) => (
                          <figure
                            key={media.mediaId}
                            className="eo-dest-media-gallery__item"
                          >
                            <img src={media.url} alt={media.label} />
                            <figcaption>
                              <strong>{media.label}</strong>
                              <span>
                                {media.provenance === "PROTOTYPE_ILLUSTRATION"
                                  ? "Visual prototype"
                                  : "Ditambahkan Mitra Destinasi"}
                              </span>
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    ) : (
                      <p className="eo-dest-facility-empty">Belum ada foto</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}

      <section
        className="eo-dest-decision-facts"
        aria-label="Ringkasan keputusan destinasi"
      >
        <div className="eo-dest-decision-fact">
          <span>Pemandu lokal</span>
          <strong>Tersedia sebagai bagian dari standar verifikasi</strong>
        </div>
        <div className="eo-dest-decision-fact">
          <span>Kapasitas umum destinasi</span>
          <strong>{destination.capacityPerSession} orang/sesi</strong>
        </div>
        <div className="eo-dest-decision-fact">
          <span>Biaya dasar</span>
          <strong>
            Rp{destination.baseCostPerPerson.toLocaleString("id-ID")} / orang
          </strong>
        </div>
        <div className="eo-dest-decision-fact">
          <span>Tarif pemandu lokal</span>
          <strong>
            Rp
            {(destination.localGuideFeePerPerson ?? 0).toLocaleString(
              "id-ID",
            )}{" "}
            / orang
          </strong>
        </div>
      </section>

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
              <p className="eo-dest-detail-card__hint">
                Catatan ini bersifat deskriptif untuk membantu perencanaan
                Travel Organizer, bukan sertifikasi keselamatan atau persetujuan
                operasional.
              </p>
              <ul className="eo-dest-detail-bullet-list">
                {destination.operationalNotes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Cakupan Biaya Dasar Destinasi (P1-E01) */}
          <section className="eo-dest-detail-card">
            <h2 className="eo-dest-detail-card__title">
              Cakupan Biaya Dasar Destinasi
            </h2>
            <p className="eo-dest-detail-card__hint">
              Biaya dasar modal:{" "}
              <strong>
                Rp{destination.baseCostPerPerson.toLocaleString("id-ID")} /
                orang
              </strong>{" "}
              (komponen biaya modal destinasi per peserta perjalanan).
            </p>

            {(destination.baseCostIncludes &&
              destination.baseCostIncludes.length > 0) ||
            (destination.baseCostExcludes &&
              destination.baseCostExcludes.length > 0) ? (
              <div
                className="eo-pkg-provisions-grid"
                style={{ marginTop: "var(--space-3)" }}
              >
                <div className="eo-pkg-provision-box">
                  <strong className="eo-pkg-provision-title eo-pkg-provision-title--included">
                    Termasuk Biaya Dasar:
                  </strong>
                  {destination.baseCostIncludes &&
                  destination.baseCostIncludes.length > 0 ? (
                    <ul className="eo-pkg-provision-list">
                      {destination.baseCostIncludes.map((inc, i) => (
                        <li key={i}>{inc}</li>
                      ))}
                    </ul>
                  ) : (
                    <span
                      style={{
                        fontSize: "var(--font-size-caption)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Tidak ada rincian spesifik
                    </span>
                  )}
                </div>

                <div className="eo-pkg-provision-box">
                  <strong className="eo-pkg-provision-title eo-pkg-provision-title--excluded">
                    Belum Termasuk:
                  </strong>
                  {destination.baseCostExcludes &&
                  destination.baseCostExcludes.length > 0 ? (
                    <ul className="eo-pkg-provision-list">
                      {destination.baseCostExcludes.map((exc, i) => (
                        <li key={i}>{exc}</li>
                      ))}
                    </ul>
                  ) : (
                    <span
                      style={{
                        fontSize: "var(--font-size-caption)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Tidak ada rincian spesifik
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p
                style={{
                  margin: "var(--space-2) 0 0",
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-muted)",
                }}
              >
                Rincian cakupan biaya belum tersedia.
              </p>
            )}
          </section>
        </div>

        {/* Side Column */}
        <aside className="eo-dest-detail-side">
          {/* Pemandu Lokal */}
          <div className="eo-dest-side-card">
            <h3 className="eo-dest-side-title">Pemanduan Lokal</h3>
            <p className="eo-dest-side-text">
              {destination.localGuideSummary ??
                (destination.guideReady
                  ? "Mitra destinasi menyediakan pemandu lokal terlatih untuk mendampingi alur trip di lokasi."
                  : "Destinasi belum memiliki pemandu lokal resmi terverifikasi di lokasi.")}
            </p>
            <p
              style={{
                fontSize: "var(--font-size-caption)",
                color: "var(--color-text-secondary)",
                marginTop: "var(--space-2)",
                lineHeight: 1.4,
              }}
            >
              {destination.guideReady
                ? "Kesiapan pemandu lokal merupakan informasi kemampuan destinasi secara umum, bukan penugasan pemandu individu untuk jadwal tertentu."
                : "Kesiapan pemandu lokal belum terverifikasi untuk destinasi ini, sehingga belum dapat digunakan dalam perancangan paket Travel Organizer."}
            </p>
          </div>

          {/* Kapasitas & Operasional */}
          <div className="eo-dest-side-card">
            <h3 className="eo-dest-side-title">Kapasitas Destinasi</h3>
            <div className="eo-dest-spec-row">
              <span className="eo-dest-spec-label">
                Kapasitas umum destinasi
              </span>
              <strong className="eo-dest-spec-val">
                {destination.capacityPerSession} orang/sesi
              </strong>
            </div>
            <p
              style={{
                fontSize: "var(--font-size-caption)",
                color: "var(--color-text-secondary)",
                marginTop: "var(--space-2)",
                marginBottom: "var(--space-2)",
                lineHeight: 1.4,
              }}
            >
              Kapasitas umum destinasi per sesi. Alokasi kuota paket aktual
              ditentukan oleh Travel Organizer saat membuka jadwal sesi.
            </p>
            <div className="eo-dest-spec-row">
              <span className="eo-dest-spec-label">Area / Kota</span>
              <span className="eo-dest-spec-val">
                {destination.city}, {destination.province}
              </span>
            </div>
          </div>

          {/* Action Card */}
          {isEligible ? (
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
                {openedFromBuilder
                  ? "Pilih Destinasi Ini"
                  : "Buat Paket Sekarang"}
              </Button>
            </div>
          ) : (
            <div className="eo-dest-side-cta-card eo-dest-side-cta-card--disabled">
              <h3 className="eo-dest-side-cta-title">Belum Dapat Dipilih</h3>
              <p className="eo-dest-side-cta-desc">
                Destinasi ini belum memiliki kesiapan pemandu lokal
                terverifikasi sehingga belum memenuhi syarat pembuatan paket
                Travel Organizer.
              </p>
              <Button type="button" variant="secondary" size="md" disabled>
                Tidak Dapat Dibuat Paket
              </Button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
