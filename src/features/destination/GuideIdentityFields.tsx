import { useState } from "react";
import { validateGuidePhoto } from "../../data/partnerRegistrationRepository";
import type { LocalGuideIdentity } from "../eo/partnerRegistrationTypes";

export function GuideIdentityFields({
  value,
  onChange,
  onPhoto,
}: {
  value: LocalGuideIdentity;
  onChange: (value: LocalGuideIdentity) => void;
  onPhoto: (file: File) => void;
}) {
  const [error, setError] = useState<string>();
  const fields = [
    ["fullName", "Nama lengkap pemandu", "text"],
    ["phone", "Nomor WhatsApp pemandu", "tel"],
    ["domicile", "Domisili pemandu", "text"],
    ["experience", "Pengalaman / sertifikasi pemandu", "text"],
  ] as const;
  return (
    <>
      <p className="eo-form-helper">
        Daftarkan pemandu lokal yang bertanggung jawab mendampingi peserta. Data
        kontak dan foto digunakan untuk peninjauan pengajuan.
      </p>
      {fields.map(([key, label, type]) => (
        <div className="eo-form-group" key={key}>
          <label htmlFor={`dest-guide-${key}`} className="eo-form-label">
            {label} *
          </label>
          <input
            id={`dest-guide-${key}`}
            className="eo-form-input"
            type={type}
            required
            value={value[key]}
            onChange={(event) =>
              onChange({ ...value, [key]: event.target.value })
            }
          />
        </div>
      ))}
      <div className="eo-form-group">
        <label htmlFor="dest-guide-photo" className="eo-form-label">
          Foto pemandu *
        </label>
        <input
          id="dest-guide-photo"
          type="file"
          className="eo-form-input"
          accept="image/jpeg,image/png,image/webp"
          aria-describedby="guide-photo-help"
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const invalid = validateGuidePhoto(file);
            setError(invalid);
            if (invalid) {
              event.target.value = "";
              return;
            }
            const reader = new FileReader();
            reader.onerror = () =>
              setError("Foto belum dapat dibaca. Pilih ulang file.");
            reader.onload = () => {
              onPhoto(file);
              onChange({ ...value, photoPreview: String(reader.result) });
            };
            reader.readAsDataURL(file);
          }}
        />
        <span id="guide-photo-help" className="eo-form-helper">
          JPG, PNG, atau WebP, maksimal 5 MB. Foto disimpan privat bersama
          pengajuan.
        </span>
        {error && <p role="alert">{error}</p>}
        {value.photoPreview && (
          <img
            src={value.photoPreview}
            alt={`Foto pemandu ${value.fullName || "yang didaftarkan"}`}
            width="128"
            height="128"
            style={{ objectFit: "cover", borderRadius: "var(--radius-md)" }}
          />
        )}
      </div>
    </>
  );
}
