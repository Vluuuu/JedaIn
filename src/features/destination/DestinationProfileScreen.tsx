import { useState } from "react";
import { Badge, Button } from "../../components/ui";
import { getDestinationVisual } from "../../lib/assets/packageImages";
import { mockDestinationPartnerService } from "./mockDestinationPartnerService";
import { resolveAuthenticatedDestinationContext } from "./destinationContext";
import "./destination.css";

export function DestinationProfileScreen() {
  const [, setGalleryRevision] = useState(0);
  const [galleryError, setGalleryError] = useState<string | undefined>();
  const context = resolveAuthenticatedDestinationContext();
  if (!context) {
    return (
      <div className="dest-container" style={{ padding: "var(--space-8)" }}>
        <div className="admin-alert admin-alert--warning">
          <h2>Data Profil Tidak Tersedia</h2>
          <p>
            Informasi profil destinasi tidak dapat dimuat untuk sesi saat ini.
          </p>
        </div>
      </div>
    );
  }

  const { destination } = context;
  const visual = getDestinationVisual(destination.name, destination.imageUrl);

  const handleGalleryUpload = (file?: File) => {
    setGalleryError(undefined);
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setGalleryError("Gunakan file JPG, PNG, atau WebP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setGalleryError("Ukuran visual maksimal 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setGalleryError("Visual belum bisa dibaca.");
        return;
      }

      const cleanName =
        file.name.replace(/\.[^/.]+$/, "").trim() || "Visual destinasi";
      const result = mockDestinationPartnerService.addGalleryMedia({
          mediaId: `media_${destination.destinationId}_${Date.now()}`,
          url: reader.result,
          label: cleanName,
          provenance: "DESTINATION_SOURCE",
        });

      if (!result.success) {
        setGalleryError(result.message ?? "Visual belum bisa ditambahkan.");
        return;
      }

      setGalleryRevision((current) => current + 1);
    };
    reader.onerror = () => {
      setGalleryError("Visual belum bisa dibaca.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMedia = (mediaId: string) => {
    setGalleryError(undefined);
    const result = mockDestinationPartnerService.removeGalleryMedia(mediaId);
    if (!result.success) {
      setGalleryError(result.message ?? "Visual belum bisa dihapus.");
      return;
    }
    setGalleryRevision((current) => current + 1);
  };

  return (
    <div className="dest-container" style={{ maxWidth: "900px" }}>
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
            <Badge tone="success" showSymbol={false}>
              {destination.verificationLevel === "PLUS"
                ? "Terverifikasi Plus"
                : "Terverifikasi Dasar"}
            </Badge>
          </div>
          <h1 className="dest-page-title">Profil Kawasan Destinasi</h1>
          <p className="dest-page-subtitle">
            Informasi kanonikal kawasan alam yang terdaftar dan digunakan oleh
            EO untuk merancang paket.
          </p>
        </div>
      </header>

      {/* Hero Visual Card */}
      <div
        className="dest-identity__media"
        style={{
          borderRadius: "var(--radius-xl)",
          marginBottom: "var(--space-5)",
          border: "1px solid var(--color-border-default)",
        }}
        aria-hidden="true"
      >
        <img
          src={visual.svgDataUri}
          alt={`Suasana kawasan ${destination.name}`}
        />
      </div>

      <section
        className="dest-media-gallery"
        aria-labelledby="destination-media-gallery-heading"
      >
        <div className="dest-media-gallery__header">
          <div>
            <h2
              id="destination-media-gallery-heading"
              className="dest-media-gallery__title"
            >
              Galeri Destinasi
            </h2>
            <p className="dest-media-gallery__desc">
              Tambahkan visual milik destinasi agar EO punya referensi saat
              menyusun package. Visual bawaan prototype tetap diberi label
              terpisah dan bukan foto kondisi aktual.
            </p>
          </div>
          <span className="dest-media-gallery__count">
            {destination.mediaGallery?.length ?? 0} visual
          </span>
        </div>

        <div className="dest-media-upload">
          <div>
            <strong>Tambah visual destinasi</strong>
            <span>JPG, PNG, atau WebP · maksimal 5 MB · maksimal 8 visual</span>
          </div>
          <label className="dest-media-upload__button">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                handleGalleryUpload(file);
                event.currentTarget.value = "";
              }}
              aria-label="Tambah visual ke galeri destinasi"
            />
            Tambah Visual
          </label>
        </div>

        {galleryError && (
          <p className="dest-media-gallery__error" role="alert">
            {galleryError}
          </p>
        )}

        {destination.mediaGallery && destination.mediaGallery.length > 0 ? (
          <div className="dest-media-gallery__grid">
            {destination.mediaGallery.map((media) => (
              <figure key={media.mediaId} className="dest-media-gallery__item">
                <img src={media.url} alt={media.label} />
                <figcaption>
                  <div>
                    <strong>{media.label}</strong>
                    <span>
                      {media.provenance === "PROTOTYPE_ILLUSTRATION"
                        ? "Visual prototype"
                        : "Ditambahkan Mitra Destinasi"}
                    </span>
                  </div>
                  {media.provenance === "DESTINATION_SOURCE" && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveMedia(media.mediaId)}
                    >
                      Hapus
                    </Button>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="dest-media-gallery__empty">
            Belum ada visual di galeri destinasi.
          </p>
        )}
      </section>

      {/* Critical Edit Policy Notice */}
      <div className="admin-alert admin-alert--info">
        <strong>Ketentuan Perubahan Informasi Destinasi:</strong>
        <p style={{ margin: "var(--space-1) 0 0" }}>
          Perubahan informasi inti destinasi dapat memerlukan peninjauan ulang
          oleh Tim Kurator Admin JedaIn. Aturan field dan proses final belum
          dikunci dalam prototype.
        </p>
      </div>

      <section className="eo-section" aria-label="Informasi utama destinasi">
        <h2 className="eo-section-title">Informasi Kawasan Alam</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-4)",
            fontSize: "var(--font-size-body-sm)",
          }}
        >
          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Nama Destinasi:
            </small>
            <strong style={{ fontSize: "var(--font-size-body-md)" }}>
              {destination.name}
            </strong>
          </div>

          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Wilayah & Lokasi:
            </small>
            <strong style={{ fontSize: "var(--font-size-body-md)" }}>
              {destination.locationLabel}
            </strong>
          </div>

          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Modal Dasar per Orang:
            </small>
            <strong
              style={{
                fontSize: "var(--font-size-body-md)",
                color: "var(--color-brand-primary)",
              }}
            >
              Rp{destination.baseCostPerPerson.toLocaleString("id-ID")}
            </strong>
          </div>

          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Batas Kapasitas per Sesi:
            </small>
            <strong style={{ fontSize: "var(--font-size-body-md)" }}>
              {destination.capacityPerSession} Orang / sesi
            </strong>
          </div>

          {((destination.baseCostIncludes &&
            destination.baseCostIncludes.length > 0) ||
            (destination.baseCostExcludes &&
              destination.baseCostExcludes.length > 0)) && (
            <div
              style={{
                gridColumn: "1 / -1",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-3)",
                padding: "var(--space-3)",
                background: "var(--color-bg-surface-subtle)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border-default)",
              }}
            >
              <div>
                <small
                  style={{
                    color: "var(--color-text-muted)",
                    display: "block",
                    fontWeight: 600,
                  }}
                >
                  Termasuk Biaya Dasar:
                </small>
                {destination.baseCostIncludes &&
                destination.baseCostIncludes.length > 0 ? (
                  <ul
                    style={{
                      margin: "var(--space-1) 0 0",
                      paddingLeft: "var(--space-4)",
                      fontSize: "var(--font-size-caption)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
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

              <div>
                <small
                  style={{
                    color: "var(--color-text-muted)",
                    display: "block",
                    fontWeight: 600,
                  }}
                >
                  Belum Termasuk:
                </small>
                {destination.baseCostExcludes &&
                destination.baseCostExcludes.length > 0 ? (
                  <ul
                    style={{
                      margin: "var(--space-1) 0 0",
                      paddingLeft: "var(--space-4)",
                      fontSize: "var(--font-size-caption)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
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
          )}
        </div>

        <div
          style={{
            borderTop: "1px solid var(--color-border-default)",
            paddingTop: "var(--space-3)",
          }}
        >
          <small style={{ color: "var(--color-text-muted)", display: "block" }}>
            Tentang Destinasi:
          </small>
          <p
            style={{
              margin: "var(--space-1) 0 0",
              fontSize: "var(--font-size-body-sm)",
              color: "var(--color-text-primary)",
            }}
          >
            {destination.description}
          </p>
        </div>

        {destination.highlights && destination.highlights.length > 0 && (
          <div
            style={{
              borderTop: "1px solid var(--color-border-default)",
              paddingTop: "var(--space-3)",
            }}
          >
            <small
              style={{
                color: "var(--color-text-muted)",
                display: "block",
                marginBottom: "var(--space-1)",
              }}
            >
              Fasilitas & Daya Tarik Kunci:
            </small>
            <ul
              style={{
                margin: 0,
                paddingLeft: "1.25rem",
                color: "var(--color-text-secondary)",
                fontSize: "var(--font-size-body-sm)",
              }}
            >
              {destination.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
