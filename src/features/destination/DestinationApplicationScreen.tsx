import { useState } from "react";
import { useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import { mockDestinationPartnerService } from "./mockDestinationPartnerService";
import type { DestinationApplicationStep } from "./types";
import "./destination.css";

const STEPS = [
  { step: 1, label: "1. Pengelola & Legalitas" },
  { step: 2, label: "2. Lokasi Wilayah" },
  { step: 3, label: "3. Fasilitas & Aktivitas" },
  { step: 4, label: "4. Kapasitas & Modal" },
  { step: 5, label: "5. Kesiapan Pemandu" },
  { step: 6, label: "6. Tinjau & Submit" },
] as const;

export function DestinationApplicationScreen() {
  const navigate = useNavigate();
  const partner = partnerSessionStore.get();
  const isDestinationRole = partner?.role === "DESTINATION";

  // Check if existing application exists for this partner (e.g. reapply)
  const existingApp =
    isDestinationRole && partner
      ? mockDestinationVerificationStore.getByPartnerId(partner.id)
      : undefined;

  const [currentStep, setCurrentStep] = useState<DestinationApplicationStep>(1);

  // Form Fields initialized from existing application if available, or neutral values
  const [managementName, setManagementName] = useState(
    existingApp?.managementName ?? partner?.businessName ?? "",
  );
  const [contactPerson, setContactPerson] = useState(
    existingApp?.contactPerson ?? partner?.name ?? "",
  );
  const [phone, setPhone] = useState(
    existingApp?.contactPhone ?? "081234567890",
  );
  const [email] = useState(
    existingApp?.contactEmail ?? partner?.email ?? "destinasi@mitra.id",
  );
  const [legalDocName, setLegalDocName] = useState(
    existingApp?.legalEntityDocument?.name ??
      "Surat_Izin_Pengelolaan_Kawasan.pdf",
  );

  const [name, setName] = useState(existingApp?.name ?? "");
  const [locationLabel, setLocationLabel] = useState(
    existingApp?.locationLabel ?? "",
  );
  const [city, setCity] = useState(existingApp?.city ?? "");
  const [province] = useState(existingApp?.province ?? "Jawa Timur");

  const [description, setDescription] = useState(
    existingApp?.description ?? "",
  );
  const [highlightsInput, setHighlightsInput] = useState(
    existingApp?.highlights?.join("\n") ?? "",
  );

  const [capacityPerSession, setCapacityPerSession] = useState<number>(
    existingApp?.capacityPerSession ?? 20,
  );
  const [baseCostPerPerson, setBaseCostPerPerson] = useState<number>(
    existingApp?.baseCostPerPerson ?? 100000,
  );

  const [guideReady, setGuideReady] = useState<boolean>(
    existingApp?.declaredGuideReady ?? false,
  );
  const [guideReadinessEvidence, setGuideReadinessEvidence] = useState(
    existingApp?.guideReadinessEvidence ?? "",
  );

  const [agreedToSop, setAgreedToSop] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Anonymous / Non-Destination user guard
  if (!isDestinationRole) {
    return (
      <div
        className="dest-container"
        style={{ padding: "var(--space-8) var(--space-4)", maxWidth: "600px" }}
      >
        <div
          className="eo-section"
          style={{ textAlign: "center", padding: "var(--space-8)" }}
        >
          <h2>Pendaftaran Mitra Destinasi</h2>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Silakan masuk atau buat akun kemitraan destinasi terlebih dahulu
            sebelum mengisi formulir verifikasi lokasi.
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "var(--space-3)",
              marginTop: "var(--space-4)",
            }}
          >
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => navigate("/partner/login")}
            >
              Daftar / Masuk Akun Destinasi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    setErrorMessage(undefined);
    if (currentStep < 6) {
      setCurrentStep((prev) => (prev + 1) as DestinationApplicationStep);
    }
  };

  const handleBack = () => {
    setErrorMessage(undefined);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as DestinationApplicationStep);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(undefined);

    if (!agreedToSop) {
      setErrorMessage(
        "Wajib menyetujui standar keselamatan & SOP destinasi JedaIn.",
      );
      return;
    }

    setIsSubmitting(true);
    const splitHighlights = highlightsInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = mockDestinationPartnerService.submitApplication({
      partnerIdentityId: partner.id,
      name,
      locationLabel,
      province,
      city,
      managementName,
      contactPerson,
      phone,
      email,
      legalEntityDoc: {
        name: legalDocName,
        uploadedAt: new Date().toISOString(),
        status: "ATTACHED",
      },
      description,
      highlights: splitHighlights,
      capacityPerSession,
      baseCostPerPerson,
      guideReady,
      guideReadinessEvidence,
      agreedToSop,
    });

    setIsSubmitting(false);

    if (res.success) {
      navigate("/partner/application");
    } else {
      setErrorMessage(
        res.message ?? "Pengajuan verifikasi destinasi belum bisa diproses.",
      );
    }
  };

  return (
    <div
      className="dest-container"
      style={{ padding: "var(--space-8) var(--space-4)", maxWidth: "800px" }}
    >
      <header className="dest-page-header">
        <div>
          <Badge tone="info">Formulir Verifikasi Destinasi</Badge>
          <h1
            className="dest-page-title"
            style={{ marginTop: "var(--space-2)" }}
          >
            Pengajuan Mitra Destinasi Lokal
          </h1>
          <p className="dest-page-subtitle">
            Daftarkan lokasi alam atau ruang tenangmu untuk diverifikasi dan
            dijadikan lokasi paket wellness oleh para EO JedaIn.
          </p>
        </div>
      </header>

      {/* Stepper Header */}
      <nav
        className="dest-stepper"
        aria-label="Tahapan pengajuan verifikasi destinasi"
      >
        {STEPS.map((s) => (
          <button
            key={s.step}
            type="button"
            className={`dest-step-item ${currentStep === s.step ? "dest-step-item--active" : currentStep > s.step ? "dest-step-item--completed" : ""}`}
            onClick={() => setCurrentStep(s.step as DestinationApplicationStep)}
          >
            <span className="eo-step-badge">
              {currentStep > s.step ? "✓" : s.step}
            </span>
            <span>{s.label}</span>
          </button>
        ))}
      </nav>

      {errorMessage && (
        <div className="admin-alert admin-alert--error" role="alert">
          <strong>Perhatian:</strong>
          <p>{errorMessage}</p>
        </div>
      )}

      <form className="eo-section" onSubmit={handleSubmit} noValidate>
        {/* Step 1: Management / Legal */}
        {currentStep === 1 && (
          <fieldset
            style={{
              border: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <legend
              style={{
                fontSize: "var(--font-size-heading-sm)",
                fontWeight: "bold",
                marginBottom: "var(--space-2)",
                color: "var(--color-text-primary)",
              }}
            >
              1. Identitas Pengelola & Dokumen Legalitas
            </legend>

            <div className="eo-form-group">
              <label htmlFor="dest-mgmt-name" className="eo-form-label">
                Nama Entitas Pengelola (Pokdarwis / Yayasan / Perusahaan) *
              </label>
              <input
                id="dest-mgmt-name"
                type="text"
                required
                className="eo-form-input"
                value={managementName}
                onChange={(e) => setManagementName(e.target.value)}
                placeholder="Nama kelompok pengelola..."
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-4)",
              }}
            >
              <div className="eo-form-group">
                <label htmlFor="dest-contact-person" className="eo-form-label">
                  Penanggung Jawab Lokasi *
                </label>
                <input
                  id="dest-contact-person"
                  type="text"
                  required
                  className="eo-form-input"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Nama pengelola..."
                />
              </div>

              <div className="eo-form-group">
                <label htmlFor="dest-phone" className="eo-form-label">
                  Nomor WhatsApp Operasional *
                </label>
                <input
                  id="dest-phone"
                  type="tel"
                  required
                  className="eo-form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08..."
                />
              </div>
            </div>

            <div className="eo-form-group">
              <label htmlFor="dest-legal-doc" className="eo-form-label">
                Dokumen Izin Pengelolaan Kawasan (Metadata Simulasi)
              </label>
              <input
                id="dest-legal-doc"
                type="text"
                className="eo-form-input"
                value={legalDocName}
                onChange={(e) => setLegalDocName(e.target.value)}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "var(--space-3)",
              }}
            >
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNext}
              >
                Lanjut ke Langkah 2: Lokasi &rarr;
              </Button>
            </div>
          </fieldset>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <fieldset
            style={{
              border: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <legend
              style={{
                fontSize: "var(--font-size-heading-sm)",
                fontWeight: "bold",
                marginBottom: "var(--space-2)",
                color: "var(--color-text-primary)",
              }}
            >
              2. Lokasi & Wilayah Destinasi
            </legend>

            <div className="eo-form-group">
              <label htmlFor="dest-name" className="eo-form-label">
                Nama Destinasi / Kawasan Alam *
              </label>
              <input
                id="dest-name"
                type="text"
                required
                className="eo-form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Lereng Hijau Batu"
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-4)",
              }}
            >
              <div className="eo-form-group">
                <label htmlFor="dest-city" className="eo-form-label">
                  Kota / Kabupaten *
                </label>
                <input
                  id="dest-city"
                  type="text"
                  required
                  className="eo-form-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Kota / Kabupaten..."
                />
              </div>

              <div className="eo-form-group">
                <label htmlFor="dest-loc-label" className="eo-form-label">
                  Label Wilayah Tampilan *
                </label>
                <input
                  id="dest-loc-label"
                  type="text"
                  required
                  className="eo-form-input"
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                  placeholder="Contoh: Batu / Malang Raya"
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "var(--space-3)",
              }}
            >
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleBack}
              >
                &larr; Kembali
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNext}
              >
                Lanjut ke Langkah 3: Fasilitas &rarr;
              </Button>
            </div>
          </fieldset>
        )}

        {/* Step 3: Facilities & Activities */}
        {currentStep === 3 && (
          <fieldset
            style={{
              border: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <legend
              style={{
                fontSize: "var(--font-size-heading-sm)",
                fontWeight: "bold",
                marginBottom: "var(--space-2)",
                color: "var(--color-text-primary)",
              }}
            >
              3. Deskripsi Ketenangan & Fasilitas
            </legend>

            <div className="eo-form-group">
              <label htmlFor="dest-desc" className="eo-form-label">
                Deskripsi Suasana & Daya Tarik Ketenangan *
              </label>
              <textarea
                id="dest-desc"
                rows={3}
                required
                className="eo-form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ceritakan keindahan alam, suasana hening, dan kearifan lokal kawasan..."
              />
            </div>

            <div className="eo-form-group">
              <label htmlFor="dest-highlights" className="eo-form-label">
                Daftar Fasilitas / Daya Tarik Utama (Pisahkan dengan baris baru)
                *
              </label>
              <textarea
                id="dest-highlights"
                rows={3}
                required
                className="eo-form-textarea"
                value={highlightsInput}
                onChange={(e) => setHighlightsInput(e.target.value)}
                placeholder="Fasilitas 1&#10;Fasilitas 2"
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "var(--space-3)",
              }}
            >
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleBack}
              >
                &larr; Kembali
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNext}
              >
                Lanjut ke Langkah 4: Kapasitas & Modal &rarr;
              </Button>
            </div>
          </fieldset>
        )}

        {/* Step 4: Capacity & Base Cost */}
        {currentStep === 4 && (
          <fieldset
            style={{
              border: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <legend
              style={{
                fontSize: "var(--font-size-heading-sm)",
                fontWeight: "bold",
                marginBottom: "var(--space-2)",
                color: "var(--color-text-primary)",
              }}
            >
              4. Kapasitas Peserta & Modal Dasar Destinasi
            </legend>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-4)",
              }}
            >
              <div className="eo-form-group">
                <label htmlFor="dest-capacity" className="eo-form-label">
                  Kapasitas Maksimal Peserta per Sesi *
                </label>
                <input
                  id="dest-capacity"
                  type="number"
                  min={1}
                  max={100}
                  required
                  className="eo-form-input"
                  value={capacityPerSession}
                  onChange={(e) =>
                    setCapacityPerSession(Number(e.target.value) || 0)
                  }
                />
                <span className="eo-form-helper">
                  Batas peserta untuk menjaga suasana tetap tenang.
                </span>
              </div>

              <div className="eo-form-group">
                <label htmlFor="dest-base-cost" className="eo-form-label">
                  Modal Dasar per Orang (Rp) *
                </label>
                <input
                  id="dest-base-cost"
                  type="number"
                  min={10000}
                  step={5000}
                  required
                  className="eo-form-input"
                  value={baseCostPerPerson}
                  onChange={(e) =>
                    setBaseCostPerPerson(Number(e.target.value) || 0)
                  }
                />
                <span className="eo-form-helper">
                  Termasuk tiket masuk kawasan, kebersihan, dan fasilitas.
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "var(--space-3)",
              }}
            >
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleBack}
              >
                &larr; Kembali
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNext}
              >
                Lanjut ke Langkah 5: Kesiapan Pemandu &rarr;
              </Button>
            </div>
          </fieldset>
        )}

        {/* Step 5: Guide Readiness */}
        {currentStep === 5 && (
          <fieldset
            style={{
              border: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <legend
              style={{
                fontSize: "var(--font-size-heading-sm)",
                fontWeight: "bold",
                marginBottom: "var(--space-2)",
                color: "var(--color-text-primary)",
              }}
            >
              5. Kesiapan Pemandu Lokal (Guide Readiness)
            </legend>

            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  id="dest-guide-ready-cb"
                  checked={guideReady}
                  onChange={(e) => setGuideReady(e.target.checked)}
                  style={{ width: "1.25rem", height: "1.25rem" }}
                />
                <strong style={{ fontSize: "var(--font-size-body-md)" }}>
                  Destinasi Memiliki Pemandu Lokal Siap Ditempatkan (Guide
                  Ready)
                </strong>
              </label>
              <p
                style={{
                  margin: "var(--space-1) 0 0",
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Centang jika pengelola memiliki warga binaan yang terlatih
                memandu rute untuk EO berkategori Concept-Only.
              </p>
            </div>

            <div className="eo-form-group">
              <label htmlFor="dest-guide-evidence" className="eo-form-label">
                Bukti / Keterangan Kesiapan Pemandu *
              </label>
              <textarea
                id="dest-guide-evidence"
                rows={2}
                required
                className="eo-form-textarea"
                value={guideReadinessEvidence}
                onChange={(e) => setGuideReadinessEvidence(e.target.value)}
                placeholder="Ceritakan ketersediaan pemandu lokal di lokasi..."
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "var(--space-3)",
              }}
            >
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleBack}
              >
                &larr; Kembali
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNext}
              >
                Lanjut ke Langkah 6: Tinjau &rarr;
              </Button>
            </div>
          </fieldset>
        )}

        {/* Step 6: Review & Submit */}
        {currentStep === 6 && (
          <fieldset
            style={{
              border: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <legend
              style={{
                fontSize: "var(--font-size-heading-sm)",
                fontWeight: "bold",
                marginBottom: "var(--space-2)",
                color: "var(--color-text-primary)",
              }}
            >
              6. Tinjau & Submit untuk Verifikasi Admin
            </legend>

            <div
              style={{
                background: "var(--color-bg-surface-subtle)",
                padding: "var(--space-4)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border-default)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
              }}
            >
              <div>
                <Badge tone={guideReady ? "success" : "neutral"}>
                  {guideReady ? "Guide Ready ✓" : "Tanpa Guide Lokal"}
                </Badge>
                <h3
                  style={{
                    margin: "var(--space-2) 0 var(--space-1)",
                    fontSize: "var(--font-size-heading-md)",
                  }}
                >
                  {name || "Nama Destinasi"}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "var(--color-text-secondary)",
                    fontSize: "var(--font-size-body-sm)",
                  }}
                >
                  {locationLabel || "Wilayah"} ({city || "Kota"}, {province})
                </p>
              </div>

              <div
                style={{
                  borderTop: "1px solid var(--color-border-default)",
                  paddingTop: "var(--space-2)",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-2)",
                  fontSize: "var(--font-size-caption)",
                }}
              >
                <div>
                  Modal Dasar:{" "}
                  <strong>
                    Rp{baseCostPerPerson.toLocaleString("id-ID")} / orang
                  </strong>
                </div>
                <div>
                  Kapasitas Sesi: <strong>{capacityPerSession} Orang</strong>
                </div>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--space-3)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  id="dest-sop-agree"
                  checked={agreedToSop}
                  onChange={(e) => setAgreedToSop(e.target.checked)}
                  style={{
                    marginTop: "0.25rem",
                    width: "1.125rem",
                    height: "1.125rem",
                  }}
                />
                <span
                  style={{
                    fontSize: "var(--font-size-body-sm)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  Saya menyatakan kebenaran data kawasan alam ini dan bersedia
                  tunduk pada pedoman verifikasi keselamatan, transparansi modal
                  destinasi, dan SOP kemitraan JedaIn.
                </span>
              </label>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "var(--space-3)",
              }}
            >
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleBack}
              >
                &larr; Kembali
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isSubmitting}
                loadingLabel="Mengajukan Verifikasi..."
              >
                Submit untuk Verifikasi &rarr;
              </Button>
            </div>
          </fieldset>
        )}
      </form>
    </div>
  );
}
