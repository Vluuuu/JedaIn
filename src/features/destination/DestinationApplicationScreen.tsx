import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui";
import { partnerRegistrationRepository } from "../../data/partnerRegistrationRepository";
import type { LocalGuideIdentity } from "../eo/partnerRegistrationTypes";
import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import { generateUniqueDestinationPartnerId } from "./destinationContext";
import { GuideIdentityFields } from "./GuideIdentityFields";
import { GuideIdentitySummary } from "./GuideIdentitySummary";
import {
  demoDestinationDocumentStore,
  validateDemoDestinationDocument,
} from "./demoDestinationDocumentStore";
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
  const [partnerRole, setPartnerRole] = useState(partner?.role);
  const isDestinationRole = partnerRole === "DESTINATION";

  // Check if existing application exists for this partner (e.g. reapply)
  const existingApp =
    isDestinationRole && partner
      ? mockDestinationVerificationStore.getByPartnerId(partner.id)
      : undefined;
  const initialApp =
    existingApp?.status === "APPROVED" ? undefined : existingApp;

  const [currentStep, setCurrentStep] = useState<DestinationApplicationStep>(1);

  // Form Fields initialized from existing application if available, or neutral values
  const [managementName, setManagementName] = useState(
    initialApp?.managementName ?? "",
  );
  const [contactPerson, setContactPerson] = useState(
    initialApp?.contactPerson ?? "",
  );
  const [phone, setPhone] = useState(initialApp?.contactPhone ?? "");
  const [email, setEmail] = useState(initialApp?.contactEmail ?? "");
  const [legalDocName, setLegalDocName] = useState(
    initialApp?.legalEntityDocument?.name ?? "",
  );
  const [legalDocFile, setLegalDocFile] = useState<File | undefined>(
    initialApp
      ? demoDestinationDocumentStore.get(initialApp.applicationId)?.file
      : undefined,
  );
  const [legalDocError, setLegalDocError] = useState<string>();
  const legalDocInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialApp?.name ?? "");
  const [locationLabel, setLocationLabel] = useState(
    initialApp?.locationLabel ?? "",
  );
  const [city, setCity] = useState(initialApp?.city ?? "");
  const [province] = useState(initialApp?.province ?? "Jawa Timur");

  const [description, setDescription] = useState(initialApp?.description ?? "");
  const [highlightsInput, setHighlightsInput] = useState(
    initialApp?.highlights?.join("\n") ?? "",
  );

  const [capacityPerSession, setCapacityPerSession] = useState<number>(
    initialApp?.capacityPerSession ?? 20,
  );
  const [baseCostPerPerson, setBaseCostPerPerson] = useState<number>(
    initialApp?.baseCostPerPerson ?? 100000,
  );
  const [baseCostIncludesInput, setBaseCostIncludesInput] = useState(
    initialApp?.baseCostIncludes?.join("\n") ?? "",
  );
  const [baseCostExcludesInput, setBaseCostExcludesInput] = useState(
    initialApp?.baseCostExcludes?.join("\n") ?? "",
  );

  const guideReady = true;
  const [guideIdentity, setGuideIdentity] = useState<LocalGuideIdentity>(
    initialApp?.guideIdentity ?? {
      fullName: "",
      phone: "",
      domicile: "",
      experience: "",
    },
  );
  const [guidePhoto, setGuidePhoto] = useState<File>();

  const [agreedToSop, setAgreedToSop] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartRegistration = () => {
    const uniquePartnerId = generateUniqueDestinationPartnerId(
      "mitra.destinasi@jedain.biz.id",
    );
    partnerSessionStore.setPartner({
      id: uniquePartnerId,
      email: "mitra.destinasi@jedain.biz.id",
      name: "Mitra Destinasi Baru",
      role: "DESTINATION",
      businessName: "Pengelola Kawasan Destinasi",
    });
    setPartnerRole("DESTINATION");
  };

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
              flexWrap: "wrap",
            }}
          >
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleStartRegistration}
            >
              Daftar Destinasi Baru
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => navigate("/partner/login")}
            >
              Masuk Akun Destinasi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    setErrorMessage(undefined);
    if (currentStep === 1 && legalDocError) return;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(undefined);
    if (legalDocError) {
      setCurrentStep(1);
      setErrorMessage(legalDocError);
      return;
    }

    if (!agreedToSop) {
      setErrorMessage(
        "Wajib menyetujui standar keselamatan & SOP destinasi JedaIn.",
      );
      return;
    }

    setIsSubmitting(true);
    const currentPartner = partnerSessionStore.get();
    if (!currentPartner || currentPartner.role !== "DESTINATION") {
      setIsSubmitting(false);
      setErrorMessage("Sesi partner destinasi tidak valid.");
      return;
    }

    const splitHighlights = highlightsInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const splitCostIncludes = baseCostIncludesInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const splitCostExcludes = baseCostExcludesInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await partnerRegistrationRepository.submit({
      role: "DESTINATION",
      guidePhoto,
      details: {
        name,
        locationLabel,
        province,
        city,
        managementName,
        contactPerson,
        phone,
        email,
        legalEntityDoc: legalDocName.trim()
          ? {
              name: legalDocName,
              uploadedAt: new Date().toISOString(),
              status: "ATTACHED",
            }
          : undefined,
        description,
        highlights: splitHighlights,
        capacityPerSession,
        baseCostPerPerson,
        baseCostIncludes:
          splitCostIncludes.length > 0 ? splitCostIncludes : undefined,
        baseCostExcludes:
          splitCostExcludes.length > 0 ? splitCostExcludes : undefined,
        guideReady,
        guideReadinessEvidence: guideIdentity.experience.trim(),
        guideIdentity,
        agreedToSop,
      },
    });

    setIsSubmitting(false);

    if (res.success) {
      const savedPartner = partnerSessionStore.get();
      const savedApp = savedPartner
        ? mockDestinationVerificationStore.getByPartnerId(savedPartner.id)
        : undefined;
      if (
        legalDocFile &&
        savedApp?.legalEntityDocument?.name === legalDocFile.name
      )
        demoDestinationDocumentStore.set(savedApp.applicationId, legalDocFile);
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
          <h1 className="dest-page-title">Pengajuan Mitra Destinasi Lokal</h1>
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
            disabled={isSubmitting}
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
              <label htmlFor="dest-email" className="eo-form-label">
                Email kontak (Gmail atau email lainnya) *
              </label>
              <input
                id="dest-email"
                type="email"
                autoComplete="email"
                required
                className="eo-form-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@gmail.com"
              />
              <span className="eo-form-helper">
                Alamat ini untuk kontak pengajuan. Setelah ACC demo, email login
                @jedain.biz.id dan kata sandi dari JedaIn ditampilkan di layar.
              </span>
            </div>

            <div className="eo-form-group">
              <label htmlFor="dest-legal-doc" className="eo-form-label">
                Dokumen Izin Pengelolaan Kawasan (opsional)
              </label>
              <input
                id="dest-legal-doc"
                ref={legalDocInput}
                type="file"
                className="eo-form-input"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                aria-describedby="dest-legal-doc-help"
                aria-invalid={Boolean(legalDocError)}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const invalid = validateDemoDestinationDocument(file);
                  setLegalDocError(invalid);
                  setLegalDocFile(invalid ? undefined : file);
                  setLegalDocName(invalid ? "" : file.name);
                  if (invalid) event.target.value = "";
                }}
              />
              <span id="dest-legal-doc-help" className="eo-form-helper">
                PDF, JPG, PNG, atau WebP, maksimal 5 MB. File disimpan lokal
                untuk demo dan hanya tersedia selama sesi browser ini.
              </span>
              {legalDocName && <span>Dokumen dipilih: {legalDocName}</span>}
              {legalDocError && <p role="alert">{legalDocError}</p>}
              {(legalDocName || legalDocError) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLegalDocFile(undefined);
                    setLegalDocName("");
                    setLegalDocError(undefined);
                    if (legalDocInput.current) legalDocInput.current.value = "";
                  }}
                >
                  Hapus pilihan dokumen
                </Button>
              )}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
              3. Profil Destinasi & Fasilitas
            </legend>

            <div className="eo-form-group">
              <label htmlFor="dest-desc" className="eo-form-label">
                Tentang Destinasi *
              </label>
              <textarea
                id="dest-desc"
                rows={3}
                required
                className="eo-form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan karakter destinasi, daya tarik utama, dan konteks lokal kawasan..."
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
            disabled={isSubmitting}
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
                  Biaya modal dasar per orang untuk pemanfaatan destinasi.
                </span>
              </div>
            </div>

            <div className="eo-form-group">
              <label htmlFor="dest-cost-includes" className="eo-form-label">
                Item Termasuk dalam Biaya Dasar (Opsional, pisahkan baris baru)
              </label>
              <textarea
                id="dest-cost-includes"
                rows={2}
                className="eo-form-textarea"
                value={baseCostIncludesInput}
                onChange={(e) => setBaseCostIncludesInput(e.target.value)}
                placeholder="Contoh:&#10;Tiket masuk kawasan&#10;Penggunaan saung istirahat"
              />
              <span className="eo-form-helper">
                Layanan atau fasilitas kawasan yang sudah termasuk dalam biaya
                dasar per orang.
              </span>
            </div>

            <div className="eo-form-group">
              <label htmlFor="dest-cost-excludes" className="eo-form-label">
                Item Belum Termasuk dalam Biaya Dasar (Opsional, pisahkan baris
                baru)
              </label>
              <textarea
                id="dest-cost-excludes"
                rows={2}
                className="eo-form-textarea"
                value={baseCostExcludesInput}
                onChange={(e) => setBaseCostExcludesInput(e.target.value)}
                placeholder="Contoh:&#10;Transportasi ke lokasi&#10;Konsumsi pribadi"
              />
              <span className="eo-form-helper">
                Layanan yang tidak ditanggung oleh biaya dasar destinasi.
              </span>
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
            disabled={isSubmitting}
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
              5. Pemandu Lokal
            </legend>

            <GuideIdentityFields
              value={guideIdentity}
              onChange={setGuideIdentity}
              onPhoto={setGuidePhoto}
            />

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
            disabled={isSubmitting}
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
            <p>
              Email kontak: <strong>{email || "Belum diisi"}</strong>
            </p>
            <p>
              Dokumen izin pengelolaan:{" "}
              <strong>{legalDocName || "Belum dilampirkan"}</strong>
            </p>
            <GuideIdentitySummary guide={guideIdentity} />

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
                <h3
                  style={{
                    margin: "0 0 var(--space-1)",
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

              {(baseCostIncludesInput.trim() ||
                baseCostExcludesInput.trim()) && (
                <div
                  style={{
                    borderTop: "1px solid var(--color-border-default)",
                    paddingTop: "var(--space-2)",
                    fontSize: "var(--font-size-caption)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {baseCostIncludesInput.trim() && (
                    <div style={{ marginBottom: "var(--space-1)" }}>
                      <strong>Termasuk Biaya Dasar:</strong>{" "}
                      {baseCostIncludesInput
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                  {baseCostExcludesInput.trim() && (
                    <div>
                      <strong>Belum Termasuk:</strong>{" "}
                      {baseCostExcludesInput
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                </div>
              )}
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
