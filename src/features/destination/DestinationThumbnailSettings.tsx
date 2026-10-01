import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "../../components/ui";
import { destinationRepository } from "../../data/destinationRepository";
import type { DestinationMediaItem, DestinationRecord } from "../eo/types";

export function DestinationThumbnailSettings({
  destination,
}: {
  destination: DestinationRecord;
}) {
  const [saved, setSaved] = useState(destination);
  const [selected, setSelected] = useState<DestinationMediaItem>();
  const [upload, setUpload] = useState<DestinationMediaItem>();
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const gallery = (saved.mediaGallery ?? []).filter(
    (item) => item.category !== "FACILITY",
  );
  const options = [...gallery, ...(upload ? [upload] : [])];
  const preview = selected?.url ?? saved.imageUrl;

  const choose = (item: DestinationMediaItem) => {
    setSelected(item);
    setError(undefined);
    setMessage(undefined);
  };
  const readPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(undefined);
    setMessage(undefined);
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size === 0 ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Pilih foto JPG, PNG, atau WebP maksimal 5 MB.");
      return;
    }
    setReading(true);
    const reader = new FileReader();
    reader.onerror = () => {
      setReading(false);
      setError("Foto belum dapat dibaca. Pilih ulang file.");
    };
    reader.onload = () => {
      setReading(false);
      if (typeof reader.result !== "string") {
        setError("Foto belum dapat dibaca. Pilih ulang file.");
        return;
      }
      const item: DestinationMediaItem = {
        mediaId: `thumbnail_${crypto.randomUUID()}`,
        url: reader.result,
        label: file.name,
        category: "DESTINATION",
        provenance: "DESTINATION_SOURCE",
      };
      setUpload(item);
      choose(item);
    };
    reader.readAsDataURL(file);
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || busy || reading) return;
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    const result = await destinationRepository.updateDefaultThumbnail(
      saved.destinationId,
      selected,
    );
    setBusy(false);
    if (!result.success || !result.destination) {
      setError(result.message ?? "Thumbnail belum tersimpan. Coba lagi.");
      return;
    }
    setSaved(result.destination);
    setSelected(undefined);
    setUpload(undefined);
    setMessage("Thumbnail default destinasi tersimpan.");
  };

  return (
    <section
      className="partner-settings__section"
      aria-labelledby="destination-thumbnail-title"
    >
      <div>
        <span className="partner-settings__index">02 / Foto utama</span>
        <h2 id="destination-thumbnail-title">Thumbnail default destinasi</h2>
        <p>
          Pilih foto yang mewakili destinasi untuk tampil pada profil dan daftar
          destinasi.
        </p>
      </div>
      <form
        className="partner-settings__form dest-thumbnail"
        onSubmit={save}
        aria-busy={busy || reading}
      >
        {preview ? (
          <img
            className="dest-thumbnail__preview"
            src={preview}
            alt={`Thumbnail ${saved.name}`}
          />
        ) : (
          <div className="dest-thumbnail__empty">
            Belum ada thumbnail destinasi.
          </div>
        )}
        <fieldset
          disabled={busy || reading}
          className="dest-thumbnail__choices"
        >
          <legend>Pilih dari galeri destinasi</legend>
          {options.length ? (
            <div className="dest-thumbnail__grid">
              {options.map((item) => (
                <label key={item.mediaId} className="dest-thumbnail__option">
                  <img src={item.url} alt="" />
                  <span>
                    <input
                      type="radio"
                      name="destination-thumbnail"
                      value={item.mediaId}
                      checked={
                        (selected?.mediaId ??
                          gallery.find((photo) => photo.url === saved.imageUrl)
                            ?.mediaId) === item.mediaId
                      }
                      onChange={() => choose(item)}
                    />
                    {item.label}
                  </span>
                  {item.provenance === "PROTOTYPE_ILLUSTRATION" && (
                    <small>Ilustrasi prototype</small>
                  )}
                </label>
              ))}
            </div>
          ) : (
            <small>
              Galeri masih kosong. Unggah foto destinasi untuk memulai.
            </small>
          )}
        </fieldset>
        <label htmlFor="destination-thumbnail-upload">Unggah foto baru</label>
        <input
          id="destination-thumbnail-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={readPhoto}
          disabled={busy || reading}
        />
        <small>
          JPG, PNG, atau WebP, maksimal 5 MB. Foto disimpan setelah menekan
          Simpan thumbnail.
        </small>
        {reading && <p role="status">Membaca foto…</p>}
        {error && (
          <p role="alert" className="partner-settings__error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="partner-settings__success">
            {message}
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!selected || busy || reading}
        >
          {busy ? "Menyimpan…" : "Simpan thumbnail"}
        </Button>
      </form>
    </section>
  );
}
