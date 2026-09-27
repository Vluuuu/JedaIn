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
  const [profileSuccess, setProfileSuccess] = useState<string | undefined>();
  const [descriptionSuccess, setDescriptionSuccess] = useState<
    string | undefined
  >();
  const [descriptionError, setDescriptionError] = useState<
    string | undefined
  >();
  const [guideFeeSuccess, setGuideFeeSuccess] = useState<string | undefined>();
  const [guideFeeError, setGuideFeeError] = useState<string | undefined>();

  const context = resolveAuthenticatedDestinationContext();
  const [descriptionDraft, setDescriptionDraft] = useState(
    context?.destination.description ?? "",
  );
  const initialGuideFee = context?.destination.localGuideFeePerPerson ?? 0;
  const [guideFeeDraft, setGuideFeeDraft] = useState<number>(initialGuideFee);
  const [guideFeeInput, setGuideFeeInput] = useState<string>(
    initialGuideFee > 0 ? initialGuideFee.toLocaleString("id-ID") : "0",
  );

  const facilitiesList = context?.destination.facilities ?? [];
  const [selectedFacility, setSelectedFacility] = useState<string>(
    facilitiesList[0] ?? "",
  );

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
  const destinationMedia =
    destination.mediaGallery?.filter(
      (media) => (media.category ?? "DESTINATION") === "DESTINATION",
    ) ?? [];
  const facilityMedia =
    destination.mediaGallery?.filter(
      (media) => media.category === "FACILITY",
    ) ?? [];

  const currentSelectedFacility = selectedFacility || facilitiesList[0] || "";

  const handleUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    category: DestinationMediaCategory,
    facilityLabel?: string,
  ) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    setProfileError(undefined);
    setProfileSuccess(undefined);
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
        facilityLabel: category === "FACILITY" ? facilityLabel : undefined,
      });
      if (!added.success) {
        setProfileError(added.message);
        return;
      }
      setProfileError(undefined);
      if (category === "FACILITY" && facilityLabel) {
        setProfileSuccess(`Foto fasilitas ${facilityLabel} ditambahkan`);
      } else {
        setProfileSuccess("Foto destinasi berhasil ditambahkan");
      }
      setProfileVersion((version) => version + 1);
    };
    reader.onerror = () => setProfileError("Visual tidak dapat dibaca.");
    reader.readAsDataURL(file);
  };

  const handleRemoveMedia = (mediaId: string) => {
    setProfileError(undefined);
    setProfileSuccess(undefined);
    const removed = mockDestinationPartnerService.removeGalleryMedia(mediaId);
    if (!removed.success) {
      setProfileError(removed.message);
      return;
    }
    setProfileSuccess("Foto berhasil dihapus");
    setProfileVersion((version) => version + 1);
  };

  const handleGuideFeeChange = (val: string) => {
    setProfileError(undefined);
    setGuideFeeSuccess(undefined);
    setGuideFeeError(undefined);
    const digits = val.replace(/[^0-9]/g, "");
    const num = digits ? parseInt(digits, 10) : 0;
    setGuideFeeDraft(num);
    setGuideFeeInput(digits ? num.toLocaleString("id-ID") : "");
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
            Kelola informasi yang digunakan Travel Organizer untuk memahami
            destinasi dan merancang package experience.
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

      {/* 1. Galeri Destinasi */}
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
              kawasan kepada Travel Organizer. Visual prototype bawaan tetap
              diberi label jelas.
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

      {/* 2. Foto Fasilitas */}
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
              Tambahkan foto untuk fasilitas yang sudah tercatat agar Travel
              Organizer mendapat gambaran yang lebih jelas.
            </p>
          </div>
          <span className="dest-media-gallery__count">
            {facilityMedia.length} foto
          </span>
        </div>

        <div className="dest-facility-upload-control">
          <div className="dest-facility-select-group">
            <label
              htmlFor="facility-selector"
              className="dest-facility-select-label"
            >
              Pilih fasilitas
            </label>
            <select
              id="facility-selector"
              className="eo-form-input dest-facility-select"
              value={currentSelectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              aria-label="Pilih fasilitas"
            >
              {facilitiesList.map((fac) => (
                <option key={fac} value={fac}>
                  {fac}
                </option>
              ))}
            </select>
          </div>

          <label className="dest-media-gallery__upload-button">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="dest-media-gallery__file-input"
              aria-label={
                currentSelectedFacility
                  ? `Tambah foto untuk ${currentSelectedFacility}`
                  : "Tambah foto fasilitas"
              }
              onChange={(event) =>
                handleUpload(event, "FACILITY", currentSelectedFacility)
              }
            />
            {currentSelectedFacility
              ? `Tambah foto untuk ${currentSelectedFacility}`
              : "Tambah foto fasilitas"}
          </label>
        </div>

        <div className="dest-facility-grouped-list">
          {facilitiesList.map((fac) => {
            const photosForFac = facilityMedia.filter(
              (m) =>
                m.facilityLabel === fac ||
                (!m.facilityLabel &&
                  m.label.toLowerCase().includes(fac.toLowerCase())),
            );

            return (
              <div key={fac} className="dest-facility-group">
                <h3 className="dest-facility-group__title">{fac}</h3>
                {photosForFac.length > 0 ? (
                  renderMediaGrid(photosForFac, "Belum ada foto")
                ) : (
                  <p className="dest-facility-empty">Belum ada foto</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {profileSuccess && (
        <p
          className="dest-profile-feedback dest-profile-feedback--success"
          role="status"
        >
          ✓ {profileSuccess}
        </p>
      )}

      {profileError && (
        <p className="dest-media-gallery__error" role="alert">
          {profileError}
        </p>
      )}

      {/* 3. Informasi Destinasi */}
      <section className="eo-section" aria-label="Informasi utama destinasi">
        <h2 className="eo-section-title">Informasi Destinasi</h2>

        {/* Ringkasan 2x2 facts */}
        <div className="dest-profile-summary">
          <h3 className="dest-profile-summary__title">Ringkasan</h3>
          <div className="dest-profile-facts">
            <div className="dest-profile-fact-card">
              <span className="dest-profile-fact-label">Nama Destinasi</span>
              <strong className="dest-profile-fact-value">
                {destination.name}
              </strong>
            </div>
            <div className="dest-profile-fact-card">
              <span className="dest-profile-fact-label">Lokasi</span>
              <strong className="dest-profile-fact-value">
                {destination.locationLabel}
              </strong>
            </div>
            <div className="dest-profile-fact-card">
              <span className="dest-profile-fact-label">Biaya Dasar</span>
              <strong className="dest-profile-fact-value">
                Rp{destination.baseCostPerPerson.toLocaleString("id-ID")} /
                orang
              </strong>
            </div>
            <div className="dest-profile-fact-card">
              <span className="dest-profile-fact-label">Kapasitas Umum</span>
              <strong className="dest-profile-fact-value">
                {destination.capacityPerSession} orang / sesi
              </strong>
            </div>
          </div>
        </div>

        {/* Tentang Destinasi Editor */}
        <div className="dest-profile-editor">
          <div className="dest-profile-editor__heading">
            <div>
              <h3>Tentang Destinasi</h3>
              <p>
                Deskripsi ini membantu Travel Organizer memahami karakter lokasi
                sebelum menyusun experience.
              </p>
            </div>
          </div>
          <textarea
            className="eo-form-textarea"
            rows={4}
            value={descriptionDraft}
            onChange={(event) => {
              setProfileError(undefined);
              setDescriptionSuccess(undefined);
              setDescriptionError(undefined);
              setDescriptionDraft(event.target.value);
            }}
            aria-label="Edit deskripsi destinasi"
          />
          <div className="dest-profile-editor__actions">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setProfileError(undefined);
                setDescriptionSuccess(undefined);
                setDescriptionError(undefined);
                const result =
                  mockDestinationPartnerService.updateDescription(
                    descriptionDraft,
                  );
                if (!result.success) {
                  setDescriptionError(result.message);
                  return;
                }
                setDescriptionSuccess("Deskripsi berhasil disimpan");
                setProfileVersion((version) => version + 1);
              }}
            >
              Simpan deskripsi
            </Button>
            {descriptionSuccess && (
              <span
                className="dest-profile-feedback dest-profile-feedback--success"
                role="status"
              >
                ✓ {descriptionSuccess}
              </span>
            )}
            {descriptionError && (
              <span
                className="dest-profile-feedback dest-profile-feedback--error"
                role="alert"
              >
                {descriptionError}
              </span>
            )}
          </div>
        </div>

        {/* Tarif Pemandu Lokal Editor */}
        <div className="dest-profile-editor">
          <div className="dest-profile-editor__heading">
            <div>
              <h3>Tarif Pemandu Lokal</h3>
              <p>
                Tarif ini digunakan Travel Organizer pada skema harga ketika
                memilih pemandu dari destinasi.
              </p>
            </div>
          </div>

          <div className="dest-profile-guide-fee-wrapper">
            <div className="dest-profile-guide-fee-group">
              <span className="dest-currency-prefix">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={guideFeeInput}
                onChange={(event) => handleGuideFeeChange(event.target.value)}
                aria-label="Tarif pemandu lokal per orang"
                className="dest-currency-input"
                placeholder="0"
              />
              <span className="dest-currency-suffix">/ orang</span>
            </div>

            <div className="dest-profile-editor__actions">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  setProfileError(undefined);
                  setGuideFeeSuccess(undefined);
                  setGuideFeeError(undefined);
                  const result =
                    mockDestinationPartnerService.updateLocalGuideFee(
                      guideFeeDraft,
                    );
                  if (!result.success) {
                    setGuideFeeError(result.message);
                    return;
                  }
                  setGuideFeeSuccess("Tarif pemandu berhasil disimpan");
                  setProfileVersion((version) => version + 1);
                }}
              >
                Simpan tarif pemandu
              </Button>
              {guideFeeSuccess && (
                <span
                  className="dest-profile-feedback dest-profile-feedback--success"
                  role="status"
                >
                  ✓ {guideFeeSuccess}
                </span>
              )}
              {guideFeeError && (
                <span
                  className="dest-profile-feedback dest-profile-feedback--error"
                  role="alert"
                >
                  {guideFeeError}
                </span>
              )}
            </div>
          </div>

          <p className="dest-profile-active-fee">
            Tarif aktif: Rp
            {(
              destination.localGuideFeePerPerson ?? guideFeeDraft
            ).toLocaleString("id-ID")}{" "}
            / orang
          </p>
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
