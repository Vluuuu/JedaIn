import { useState } from "react";
import { Button } from "../../components/ui";
import { getDestinationVisual } from "../../lib/assets/packageImages";
import type { DestinationMediaCategory } from "../eo/types";
import { resolveAuthenticatedDestinationContext } from "./destinationContext";
import { mockDestinationPartnerService } from "./mockDestinationPartnerService";
import "./destination.css";

export function DestinationProfileScreen() {
  const [, setProfileVersion] = useState(0);
  const [profileError, setProfileError] = useState<string | undefined>();
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
  const [descriptionDraft, setDescriptionDraft] = useState(
    destination.description,
  );
  const [guideFeeDraft, setGuideFeeDraft] = useState(
    destination.localGuideFeePerPerson ?? 0,
  );
  const destinationMedia =
    destination.mediaGallery?.filter(
      (media) => (media.category ?? "DESTINATION") === "DESTINATION",
    ) ?? [];
  const facilityMedia =
    destination.mediaGallery?.filter((media) => media.category === "FACILITY") ??
    [];

  const handleUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    category: DestinationMediaCategory,
  ) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    setProfileError(undefined);
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setProfileError("Format visual harus JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Ukuran visual maksimal 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        setProfileError("Visual tidak dapat dibaca.");
        return;
      }

      const added = mockDestinationPartnerService.addGalleryMedia({
        url: result,
        label: file.name.replace(/\.[^.]+$/, ""),
        category,
      });
      if (!added.success) {
        setProfileError(added.message);
        return;
      }
      setProfileVersion((version) => version + 1);
    };
    reader.onerror = () => setProfileError("Visual tidak dapat dibaca.");
    reader.readAsDataURL(file);
  };

  const handleRemoveMedia = (mediaId: string) => {
    const removed = mockDestinationPartnerService.removeGalleryMedia(mediaId);
    if (!removed.success) {
      setProfileError(removed.message);
      return;
    }
    setProfileError(undefined);
    setProfileVersion((version) => version + 1);
  };

  const renderMediaGrid = (
    items: NonNullable<typeof destination.mediaGallery>,
    emptyText: string,
  ) =>
    items.length > 0 ? (
      <div className="dest-media-gallery__grid">
        {items.map((media) => (
          <figure key={media.mediaId} className="dest-media-gallery__item">
            <img src={media.url} alt={media.label} />
            <figcaption>
              <strong>{media.label}</strong>
              <span>
                {media.provenance === "PROTOTYPE_ILLUSTRATION"
                  ? "Visual prototype"
                  : "Ditambahkan Mitra Destinasi"}
              </span>
              {media.provenance === "DESTINATION_SOURCE" && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRemoveMedia(media.mediaId)}
                >
                  Hapus visual
                </Button>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    ) : (
      <p className="dest-media-gallery__empty">{emptyText}</p>
    );

  return (
    <div className="dest-container" style={{ maxWidth: "900px" }}>
      <header className="dest-page-header">
        <div>
          <h1 className="dest-page-title">Profil Kawasan Destinasi</h1>
          <p className="dest-page-subtitle">
            Kelola informasi yang digunakan EO untuk memahami destinasi dan
            merancang package experience.
          </p>
        </div>
      </header>

      <div
        className="dest-identity__media"
        style={{
          borderRadius: "var(--radius-xl)",
          marginBottom: "var(--space-5)",
          border: "1px solid var(--color-border-default)",
        }}
      >
        <img
          src={visual.svgDataUri}
          alt={`Gambaran kawasan ${destination.name}`}
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
              Tambahkan sebanyak yang dibutuhkan untuk memberi gambaran suasana
              kawasan kepada EO. Visual prototype bawaan tetap diberi label
              jelas.
            </p>
          </div>
          <span className="dest-media-gallery__count">
            {destinationMedia.length} visual
          </span>
        </div>

        <div className="dest-media-gallery__actions">
          <label className="dest-media-gallery__upload-button">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="dest-media-gallery__file-input"
              aria-label="Tambah foto destinasi"
              onChange={(event) => handleUpload(event, "DESTINATION")}
            />
            Tambah foto destinasi
          </label>
          <span className="dest-media-gallery__upload-hint">
            JPG, PNG, atau WebP · maksimal 5 MB per file.
          </span>
        </div>

        {renderMediaGrid(
          destinationMedia,
          "Belum ada visual suasana destinasi.",
        )}
      </section>

      <section
        className="dest-media-gallery"
        aria-labelledby="destination-facility-gallery-heading"
      >
        <div className="dest-media-gallery__header">
          <div>
            <h2
              id="destination-facility-gallery-heading"
              className="dest-media-gallery__title"
            >
              Foto Fasilitas
            </h2>
            <p className="dest-media-gallery__desc">
              Tambahkan foto fasilitas seperti saung, toilet, area parkir,
              musholla, paviliun, titik bilas, atau fasilitas lain yang penting
              diketahui EO.
            </p>
          </div>
          <span className="dest-media-gallery__count">
            {facilityMedia.length} foto
          </span>
        </div>

        <div className="dest-media-gallery__actions">
          <label className="dest-media-gallery__upload-button">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="dest-media-gallery__file-input"
              aria-label="Tambah foto fasilitas"
              onChange={(event) => handleUpload(event, "FACILITY")}
            />
            Tambah foto fasilitas
          </label>
        </div>

        {renderMediaGrid(
          facilityMedia,
          "Belum ada foto fasilitas yang ditambahkan Mitra Destinasi.",
        )}
      </section>

      {profileError && (
        <p className="dest-media-gallery__error" role="alert">
          {profileError}
        </p>
      )}

      <section className="eo-section" aria-label="Informasi utama destinasi">
        <h2 className="eo-section-title">Informasi Destinasi</h2>

        <div className="dest-profile-facts">
          <div>
            <small>Nama Destinasi</small>
            <strong>{destination.name}</strong>
          </div>
          <div>
            <small>Wilayah & Lokasi</small>
            <strong>{destination.locationLabel}</strong>
          </div>
          <div>
            <small>Biaya Dasar</small>
            <strong>
              Rp{destination.baseCostPerPerson.toLocaleString("id-ID")} / orang
            </strong>
          </div>
          <div>
            <small>Kapasitas Umum</small>
            <strong>{destination.capacityPerSession} orang / sesi</strong>
          </div>
        </div>

        <div className="dest-profile-editor">
          <div className="dest-profile-editor__heading">
            <div>
              <h3>Tentang Destinasi</h3>
              <p>
                Deskripsi ini dibaca EO saat mengevaluasi destinasi dan
                menyusun package.
              </p>
            </div>
          </div>
          <textarea
            className="eo-form-textarea"
            rows={4}
            value={descriptionDraft}
            onChange={(event) => setDescriptionDraft(event.target.value)}
            aria-label="Edit deskripsi destinasi"
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              const result =
                mockDestinationPartnerService.updateDescription(
                  descriptionDraft,
                );
              if (!result.success) {
                setProfileError(result.message);
                return;
              }
              setProfileError(undefined);
              setProfileVersion((version) => version + 1);
            }}
          >
            Simpan deskripsi
          </Button>
        </div>

        <div className="dest-profile-editor">
          <div className="dest-profile-editor__heading">
            <div>
              <h3>Tarif Pemandu Lokal</h3>
              <p>
                Tarif ini digunakan EO pada skema harga ketika memilih pemandu
                dari destinasi.
              </p>
            </div>
          </div>
          <div className="dest-profile-guide-fee">
            <span>Rp</span>
            <input
              type="number"
              min={0}
              step={5000}
              value={guideFeeDraft}
              onChange={(event) =>
                setGuideFeeDraft(Math.max(0, Number(event.target.value) || 0))
              }
              aria-label="Tarif pemandu lokal per orang"
              className="eo-form-input"
            />
            <span>/ orang</span>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              const result =
                mockDestinationPartnerService.updateLocalGuideFee(
                  guideFeeDraft,
                );
              if (!result.success) {
                setProfileError(result.message);
                return;
              }
              setProfileError(undefined);
              setProfileVersion((version) => version + 1);
            }}
          >
            Simpan tarif pemandu
          </Button>
        </div>

        {((destination.baseCostIncludes &&
          destination.baseCostIncludes.length > 0) ||
          (destination.baseCostExcludes &&
            destination.baseCostExcludes.length > 0)) && (
          <div className="dest-profile-cost-scope">
            <div>
              <strong>Termasuk Biaya Dasar</strong>
              {destination.baseCostIncludes?.length ? (
                <ul>
                  {destination.baseCostIncludes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>Tidak ada rincian spesifik.</p>
              )}
            </div>
            <div>
              <strong>Belum Termasuk</strong>
              {destination.baseCostExcludes?.length ? (
                <ul>
                  {destination.baseCostExcludes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>Tidak ada rincian spesifik.</p>
              )}
            </div>
          </div>
        )}

        {destination.highlights && destination.highlights.length > 0 && (
          <div className="dest-profile-list">
            <strong>Fasilitas & Daya Tarik Kunci</strong>
            <ul>
              {destination.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
