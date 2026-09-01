import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockDestinationStore } from "./mockDestinationStore";
import { mockEoPackageStore } from "./mockEoPackageStore";
import { mockInsightStore } from "./mockInsightStore";
import { partnerSessionStore } from "./partnerSessionStore";
import type {
  DestinationRecord,
  DemandInsightRecord,
  EoItineraryItem,
  EoValidationError,
} from "./types";
import "./eo.css";

const STEPS = [
  { step: 1, label: "1. Destinasi" },
  { step: 2, label: "2. Sinyal Insight" },
  { step: 3, label: "3. Rencana Itinerary" },
  { step: 4, label: "4. Skema Harga" },
  { step: 5, label: "5. Tinjau & Submit" },
] as const;

export function EoPackageBuilderScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialInsightId = searchParams.get("insightId");
  const draftId = searchParams.get("draftId");

  const partner = partnerSessionStore.get();
  const eoId = partner?.id ?? "eo_jeda_alam";
  const guideStatus = partner?.guideStatus ?? "CERTIFIED_GUIDE";

  // Ownership security check for editing drafts: must belong to current EO
  const initialDraft = draftId
    ? mockEoPackageStore.getPackageForEo(draftId, eoId)
    : undefined;

  const isForeignDraft = Boolean(draftId && !initialDraft);

  const initialInsight = initialInsightId
    ? mockInsightStore.getInsightById(initialInsightId)
    : undefined;

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [packageId, setPackageId] = useState<string | undefined>(
    initialDraft?.packageId ?? undefined,
  );

  // Form State
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>(
    initialDraft?.destinationId ?? "",
  );
  const [selectedInsightId, setSelectedInsightId] = useState<
    string | undefined
  >(initialDraft?.insightId ?? initialInsightId ?? undefined);
  const [title, setTitle] = useState<string>(
    initialDraft?.title ??
      (initialInsight ? `Jeda Mindful: ${initialInsight.intentLabel}` : ""),
  );
  const [shortSummary, setShortSummary] = useState<string>(
    initialDraft?.shortSummary ??
      initialDraft?.valueProposition ??
      initialInsight?.unmetDemandDescription ??
      "",
  );
  const [durationLabel, setDurationLabel] = useState<string>(
    initialDraft?.durationLabel ?? initialInsight?.durationLabel ?? "1 hari",
  );
  const [itinerary, setItinerary] = useState<EoItineraryItem[]>(
    initialDraft?.itinerary && initialDraft.itinerary.length > 0
      ? initialDraft.itinerary
      : [
          {
            order: 1,
            title: "Pagi - Titik Kumpul & Sambutan Teh",
            description:
              "Tiba di lokasi, perkenalan hangat dengan pemandu, dan menikmati seduhan teh herbal hangat.",
            timeOfDayLabel: "Pagi",
            durationLabel: "1 jam",
          },
          {
            order: 2,
            title: "Menjelajah Jalur Alami & Sesi Hening",
            description:
              "Berjalan santai menyusuri keindahan alam lokasi dipandu dengan jeda napas ringan untuk merilekskan pikiran.",
            timeOfDayLabel: "Siang",
            durationLabel: "2 jam",
          },
        ],
  );
  const [safetyNotes, setSafetyNotes] = useState<string>(
    initialDraft?.safetyNotes?.join("\n") ??
      "Gunakan alas kaki yang nyaman dan tidak licin.\nPatuhi arahan pemandu selama kegiatan di lokasi.",
  );
  const [eoMargin, setEoMargin] = useState<number>(
    initialDraft?.pricing?.eoMargin ?? 150000,
  );
  const [validationErrors, setValidationErrors] = useState<EoValidationError[]>(
    [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available data - Step 1 uses eligible destinations
  const eligibleDestinations =
    mockDestinationStore.getEligibleForEo(guideStatus);
  const allInsights = mockInsightStore.getAllInsights();

  if (isForeignDraft) {
    return (
      <div className="eo-container">
        <div
          className="eo-section"
          style={{ textAlign: "center", padding: "var(--space-8)" }}
        >
          <h2>Akses Ditolak</h2>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Draf paket ini tidak ditemukan atau bukan milik akun EO Anda.
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

  const selectedDestination: DestinationRecord | undefined =
    mockDestinationStore.getById(selectedDestinationId);
  const selectedInsight: DemandInsightRecord | undefined = selectedInsightId
    ? mockInsightStore.getInsightById(selectedInsightId)
    : undefined;

  const baseCost = selectedDestination?.baseCostPerPerson ?? 100000;
  const customerPrice = baseCost + eoMargin;

  // Auto-save draft on moving
  const saveCurrentDraft = () => {
    const splitSafety = safetyNotes
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = mockEoPackageStore.saveDraft({
      packageId,
      title,
      shortSummary,
      valueProposition: shortSummary,
      destinationId: selectedDestinationId,
      insightId: selectedInsightId,
      durationLabel,
      itinerary,
      safetyNotes: splitSafety,
      pricing: {
        destinationBaseCost: baseCost,
        eoMargin,
        customerPrice,
      },
    });
    if (res.success && res.package && !packageId) {
      setPackageId(res.package.packageId);
    }
    return res.package;
  };

  const handleNext = () => {
    saveCurrentDraft();
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    saveCurrentDraft();
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Itinerary helpers
  const handleAddItinerary = () => {
    const nextOrder = itinerary.length + 1;
    setItinerary([
      ...itinerary,
      {
        order: nextOrder,
        title: "",
        description: "",
        timeOfDayLabel: "Siang",
        durationLabel: "1 jam",
      },
    ]);
  };

  const handleRemoveItinerary = (index: number) => {
    const updated = itinerary
      .filter((_, i) => i !== index)
      .map((item, i) => ({
        ...item,
        order: i + 1,
      }));
    setItinerary(updated);
  };

  const handleUpdateItinerary = (
    index: number,
    field: keyof EoItineraryItem,
    value: string,
  ) => {
    const updated = [...itinerary];
    updated[index] = { ...updated[index], [field]: value };
    setItinerary(updated);
  };

  // Submit action (Step 5)
  const handleSubmitForReview = () => {
    setIsSubmitting(true);
    setValidationErrors([]);

    const draft = saveCurrentDraft();
    if (!draft) {
      setIsSubmitting(false);
      return;
    }

    const res = mockEoPackageStore.submitForReview(draft.packageId);

    setIsSubmitting(false);

    if (res.success && res.package) {
      navigate(`/partner/eo/packages/${res.package.packageId}`);
    } else {
      setValidationErrors(res.validationResult.errors);
    }
  };

  return (
    <div className="eo-container">
      <header className="eo-page-header">
        <div>
          <Badge tone="info">Trip Builder</Badge>
          <h1 className="eo-page-title" style={{ marginTop: "var(--space-2)" }}>
            Rancang Paket Wellness Terkurasi
          </h1>
          <p className="eo-page-subtitle">
            Pilih destinasi terverifikasi, selaraskan dengan sinyal kebutuhan
            traveler, dan susun alur mindful itinerary.
          </p>
        </div>
      </header>

      {/* Stepper Header */}
      <nav className="eo-stepper" aria-label="Tahapan perancangan paket">
        {STEPS.map((s) => (
          <button
            key={s.step}
            type="button"
            className={`eo-step-item ${currentStep === s.step ? "eo-step-item--active" : currentStep > s.step ? "eo-step-item--completed" : ""}`}
            onClick={() => {
              saveCurrentDraft();
              setCurrentStep(s.step);
            }}
          >
            <span className="eo-step-badge">
              {currentStep > s.step ? "✓" : s.step}
            </span>
            <span>{s.label}</span>
          </button>
        ))}
      </nav>

      {/* Validation Error Banner */}
      {validationErrors.length > 0 && (
        <div className="eo-alert eo-alert--error" role="alert">
          <strong style={{ fontSize: "var(--font-size-body-md)" }}>
            Paket belum memenuhi standar kurasi ({validationErrors.length}{" "}
            kendala ditemukan):
          </strong>
          <ul style={{ margin: "var(--space-2) 0 0", paddingLeft: "1.25rem" }}>
            {validationErrors.map((err, i) => (
              <li key={i}>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "var(--color-danger-solid)",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                  onClick={() => setCurrentStep(err.step)}
                >
                  Langkah {err.step}: {err.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* STEP 1: DESTINATION SELECTION */}
      {currentStep === 1 && (
        <section className="eo-section" aria-label="Pilih destinasi">
          <div className="eo-section-header">
            <div>
              <h2 className="eo-section-title">
                Langkah 1: Pilih Destinasi Terverifikasi
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--font-size-body-sm)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Menampilkan destinasi yang memenuhi syarat untuk kategori EO
                Anda (
                <strong>
                  {guideStatus === "CERTIFIED_GUIDE"
                    ? "Certified Guide"
                    : "Concept-Only"}
                </strong>
                ).
                {guideStatus === "CONCEPT_ONLY" && (
                  <span
                    style={{
                      color: "var(--color-warning-text)",
                      display: "block",
                      marginTop: "0.25rem",
                    }}
                  >
                    Status EO Anda Concept-Only: Hanya destinasi Guide Ready
                    (memiliki pemandu lokal terlatih) yang dapat dipilih.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="eo-destinations-grid">
            {eligibleDestinations.map((dest) => {
              const isSelected = selectedDestinationId === dest.destinationId;

              return (
                <article
                  key={dest.destinationId}
                  className={`eo-destination-card ${isSelected ? "eo-destination-card--selected" : ""}`}
                  onClick={() => {
                    setSelectedDestinationId(dest.destinationId);
                  }}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedDestinationId(dest.destinationId);
                    }
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: "var(--space-2)",
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      <Badge
                        tone={
                          dest.verificationLevel === "PLUS" ? "info" : "success"
                        }
                      >
                        {dest.verificationLevel === "PLUS"
                          ? "Verifikasi PLUS"
                          : "Verifikasi BASIC"}
                      </Badge>
                      <Badge tone={dest.guideReady ? "success" : "neutral"}>
                        {dest.guideReady
                          ? "Guide Ready ✓"
                          : "Tanpa Guide Lokal"}
                      </Badge>
                    </div>

                    <h3
                      style={{
                        fontSize: "var(--font-size-heading-sm)",
                        margin: "0 0 var(--space-1)",
                      }}
                    >
                      {dest.name}
                    </h3>
                    <p
                      style={{
                        fontSize: "var(--font-size-caption)",
                        color: "var(--color-text-secondary)",
                        margin: "0 0 var(--space-2)",
                      }}
                    >
                      {dest.locationLabel}
                    </p>
                    <p
                      style={{
                        fontSize: "var(--font-size-body-sm)",
                        color: "var(--color-text-secondary)",
                        margin: 0,
                      }}
                    >
                      {dest.description}
                    </p>
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid var(--color-border-default)",
                      paddingTop: "var(--space-3)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <small style={{ color: "var(--color-text-muted)" }}>
                        Modal Dasar:
                      </small>
                      <strong
                        style={{
                          display: "block",
                          color: "var(--color-brand-primary)",
                          fontSize: "var(--font-size-body-sm)",
                        }}
                      >
                        Rp{dest.baseCostPerPerson.toLocaleString("id-ID")} /
                        orang
                      </strong>
                    </div>

                    <Button
                      type="button"
                      variant={isSelected ? "primary" : "secondary"}
                      size="sm"
                    >
                      {isSelected ? "Terpilih ✓" : "Pilih Destinasi"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "var(--space-4)",
            }}
          >
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={!selectedDestinationId}
              onClick={handleNext}
            >
              Lanjut ke Langkah 2: Sinyal Insight &rarr;
            </Button>
          </div>
        </section>
      )}

      {/* STEP 2: RELEVANT DEMAND INSIGHT */}
      {currentStep === 2 && (
        <section
          className="eo-section"
          aria-label="Sinyal insight dan informasi umum"
        >
          <div className="eo-section-header">
            <div>
              <h2 className="eo-section-title">
                Langkah 2: Sinyal Insight & Informasi Pengalaman
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--font-size-body-sm)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Pilih konteks permintaan traveler yang melandasi paket ini dan
                tentukan judul pengalaman.
              </p>
            </div>
          </div>

          {/* Insight Selector */}
          <div className="eo-form-group">
            <label className="eo-form-label">
              Sinyal Kebutuhan Terkait (Opsional):
            </label>
            <div
              className="eo-insights-grid"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              }}
            >
              {allInsights.map((ins) => {
                const isInsSelected = selectedInsightId === ins.insightId;
                return (
                  <div
                    key={ins.insightId}
                    className={`eo-insight-card ${isInsSelected ? "eo-insight-card--selected" : ""}`}
                    style={{ cursor: "pointer", padding: "var(--space-4)" }}
                    onClick={() =>
                      setSelectedInsightId(
                        isInsSelected ? undefined : ins.insightId,
                      )
                    }
                  >
                    <div>
                      <Badge tone={isInsSelected ? "info" : "neutral"}>
                        {ins.intentLabel}
                      </Badge>
                      <h3
                        style={{
                          margin: "var(--space-2) 0 var(--space-1)",
                          fontSize: "var(--font-size-body-md)",
                        }}
                      >
                        {ins.title}
                      </h3>
                      <p
                        style={{
                          fontSize: "var(--font-size-caption)",
                          color: "var(--color-text-secondary)",
                          margin: 0,
                        }}
                      >
                        {ins.unmetDemandDescription}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={isInsSelected ? "primary" : "secondary"}
                      size="sm"
                    >
                      {isInsSelected ? "Terpilih ✓" : "Gunakan Insight Ini"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Title & Description Form */}
          <div
            className="eo-form-group"
            style={{ marginTop: "var(--space-4)" }}
          >
            <label htmlFor="package-title" className="eo-form-label">
              Judul Paket Experience *
            </label>
            <input
              id="package-title"
              type="text"
              required
              className="eo-form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Sehari Pelan di Lereng Hijau"
            />
          </div>

          <div className="eo-form-group">
            <label htmlFor="package-summary" className="eo-form-label">
              Ringkasan Nilai & Janji Pengalaman (Value Proposition) *
            </label>
            <textarea
              id="package-summary"
              rows={3}
              required
              className="eo-form-textarea"
              value={shortSummary}
              onChange={(e) => setShortSummary(e.target.value)}
              placeholder="Jelaskan suasana jeda, ketenangan, dan apa yang dirasakan traveler selama perjalanan..."
            />
          </div>

          <div className="eo-form-group">
            <label htmlFor="package-duration" className="eo-form-label">
              Estimasi Durasi *
            </label>
            <select
              id="package-duration"
              className="eo-form-select"
              value={durationLabel}
              onChange={(e) => setDurationLabel(e.target.value)}
            >
              <option value="Setengah hari">Setengah hari (4 - 5 jam)</option>
              <option value="1 hari">1 hari penuh (6 - 8 jam)</option>
              <option value="2 hari 1 malam">
                2 hari 1 malam (Retreat Menginap)
              </option>
            </select>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "var(--space-4)",
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
              size="lg"
              onClick={handleNext}
            >
              Lanjut ke Langkah 3: Itinerary &rarr;
            </Button>
          </div>
        </section>
      )}

      {/* STEP 3: ITINERARY BUILDER */}
      {currentStep === 3 && (
        <section className="eo-section" aria-label="Susun rencana perjalanan">
          <div className="eo-section-header">
            <div>
              <h2 className="eo-section-title">
                Langkah 3: Rencana Perjalanan (Itinerary) & Keselamatan
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--font-size-body-sm)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Susun alur kegiatan dengan ritme tenang, jelas, dan tidak
                terburu-buru.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddItinerary}
            >
              + Tambah Aktivitas
            </Button>
          </div>

          <div className="eo-itinerary-list">
            {itinerary.map((item, idx) => (
              <div key={idx} className="eo-itinerary-item">
                <div className="eo-itinerary-header">
                  <Badge tone="info">Aktivitas #{item.order}</Badge>
                  {itinerary.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveItinerary(idx)}
                    >
                      Hapus
                    </Button>
                  )}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: "var(--space-3)",
                  }}
                >
                  <div className="eo-form-group">
                    <label className="eo-form-label">
                      Nama Kegiatan / Titik Sesi *
                    </label>
                    <input
                      type="text"
                      required
                      className="eo-form-input"
                      value={item.title}
                      onChange={(e) =>
                        handleUpdateItinerary(idx, "title", e.target.value)
                      }
                      placeholder="Contoh: Jalan Santai di Perkebunan Teh & Sesi Napas"
                    />
                  </div>

                  <div className="eo-form-group">
                    <label className="eo-form-label">Waktu / Durasi</label>
                    <input
                      type="text"
                      className="eo-form-input"
                      value={item.durationLabel ?? ""}
                      onChange={(e) =>
                        handleUpdateItinerary(
                          idx,
                          "durationLabel",
                          e.target.value,
                        )
                      }
                      placeholder="Contoh: 1.5 jam (Pagi)"
                    />
                  </div>
                </div>

                <div className="eo-form-group">
                  <label className="eo-form-label">Deskripsi Aktivitas *</label>
                  <textarea
                    rows={2}
                    required
                    className="eo-form-textarea"
                    value={item.description}
                    onChange={(e) =>
                      handleUpdateItinerary(idx, "description", e.target.value)
                    }
                    placeholder="Ceritakan detail kegiatan mindful yang dilakukan traveler..."
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Safety and Operational Notes */}
          <div
            className="eo-form-group"
            style={{ marginTop: "var(--space-4)" }}
          >
            <label htmlFor="eo-safety-notes" className="eo-form-label">
              Catatan Operasional & Keselamatan *
            </label>
            <textarea
              id="eo-safety-notes"
              rows={3}
              required
              className="eo-form-textarea"
              value={safetyNotes}
              onChange={(e) => setSafetyNotes(e.target.value)}
              placeholder="Pisahkan dengan baris baru (misal: alas kaki yang nyaman, pakaian hangat, dsb)..."
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "var(--space-4)",
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
              size="lg"
              onClick={handleNext}
            >
              Lanjut ke Langkah 4: Skema Harga &rarr;
            </Button>
          </div>
        </section>
      )}

      {/* STEP 4: PRICING BREAKDOWN */}
      {currentStep === 4 && (
        <section className="eo-section" aria-label="Skema harga dan margin">
          <div className="eo-section-header">
            <div>
              <h2 className="eo-section-title">
                Langkah 4: Skema Harga Transparan
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--font-size-body-sm)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Formula MVP:{" "}
                <strong>
                  Customer Price = Modal Dasar Destinasi + Margin EO
                </strong>
                .
              </p>
            </div>
          </div>

          <div className="eo-form-group">
            <label htmlFor="eo-margin-input" className="eo-form-label">
              Margin Layanan & Kepemanduan EO (Rp / Orang) *
            </label>
            <input
              id="eo-margin-input"
              type="number"
              min={0}
              step={10000}
              required
              className="eo-form-input"
              value={eoMargin}
              onChange={(e) =>
                setEoMargin(Math.max(0, Number(e.target.value) || 0))
              }
            />
            <span className="eo-form-helper">
              Mencakup jasa pemandu, fasilitas pendukung, koordinasi sesi, dan
              konsumsi.
            </span>
          </div>

          {/* Pricing Breakdown Card */}
          <div className="eo-pricing-summary">
            <h3 style={{ fontSize: "var(--font-size-heading-sm)", margin: 0 }}>
              Rincian Transparansi Harga
            </h3>

            <div className="eo-pricing-row">
              <span>
                Modal Dasar Destinasi (
                {selectedDestination?.name ?? "Destinasi"}):
              </span>
              <strong>Rp{baseCost.toLocaleString("id-ID")}</strong>
            </div>

            <div className="eo-pricing-row">
              <span>Margin Operasional & Pemandu EO:</span>
              <strong>Rp{eoMargin.toLocaleString("id-ID")}</strong>
            </div>

            <div className="eo-pricing-row eo-pricing-row--total">
              <span>Harga Jual ke Traveler (Customer Price):</span>
              <span>Rp{customerPrice.toLocaleString("id-ID")} / orang</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "var(--space-4)",
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
              size="lg"
              onClick={handleNext}
            >
              Lanjut ke Langkah 5: Tinjau & Submit &rarr;
            </Button>
          </div>
        </section>
      )}

      {/* STEP 5: REVIEW & SUBMIT */}
      {currentStep === 5 && (
        <section
          className="eo-section"
          aria-label="Tinjau dan submit untuk kurasi"
        >
          <div className="eo-section-header">
            <div>
              <h2 className="eo-section-title">
                Langkah 5: Tinjau & Ajukan untuk Review Kurasi
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--font-size-body-sm)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Periksa kelengkapan paket sebelum dikirim ke Tim Kurator Admin
                JedaIn.
              </p>
            </div>
          </div>

          {/* Package Preview Sheet */}
          <div
            style={{
              background: "var(--color-bg-surface-subtle)",
              padding: "var(--space-5)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border-default)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  gap: "var(--space-2)",
                  marginBottom: "var(--space-2)",
                }}
              >
                <Badge tone="info">{durationLabel}</Badge>
                {selectedInsight && (
                  <Badge tone="success">{selectedInsight.intentLabel}</Badge>
                )}
                {selectedDestination && (
                  <Badge tone="neutral">{selectedDestination.name}</Badge>
                )}
              </div>

              <h3
                style={{
                  fontSize: "var(--font-size-heading-md)",
                  margin: "0 0 var(--space-1)",
                  color: "var(--color-text-primary)",
                }}
              >
                {title || "Draf Tanpa Judul"}
              </h3>
              <p
                style={{
                  fontSize: "var(--font-size-body-md)",
                  color: "var(--color-text-secondary)",
                  margin: 0,
                }}
              >
                {shortSummary || "Belum ada ringkasan pengalaman."}
              </p>
            </div>

            {/* Itinerary Preview */}
            <div
              style={{
                borderTop: "1px solid var(--color-border-default)",
                paddingTop: "var(--space-3)",
              }}
            >
              <strong
                style={{
                  fontSize: "var(--font-size-label-md)",
                  display: "block",
                  marginBottom: "var(--space-2)",
                }}
              >
                Alur Itinerary ({itinerary.length} Aktivitas):
              </strong>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                {itinerary.map((item) => (
                  <div
                    key={item.order}
                    style={{
                      fontSize: "var(--font-size-body-sm)",
                      padding: "var(--space-2) var(--space-3)",
                      background: "var(--color-stone-0)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border-default)",
                    }}
                  >
                    <strong>
                      #{item.order} {item.title || "Aktivitas"}
                    </strong>{" "}
                    {item.durationLabel && `(${item.durationLabel})`}
                    <p
                      style={{
                        margin: "0.25rem 0 0",
                        color: "var(--color-text-secondary)",
                        fontSize: "var(--font-size-caption)",
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Preview */}
            <div
              style={{
                borderTop: "1px solid var(--color-border-default)",
                paddingTop: "var(--space-3)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <small style={{ color: "var(--color-text-muted)" }}>
                  Total Harga ke Traveler:
                </small>
                <div
                  style={{
                    fontSize: "var(--font-size-heading-md)",
                    fontWeight: "bold",
                    color: "var(--color-brand-primary)",
                  }}
                >
                  Rp{customerPrice.toLocaleString("id-ID")} / orang
                </div>
              </div>
              <div
                style={{
                  textAlign: "right",
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-secondary)",
                }}
              >
                <span>
                  Modal Destinasi: Rp{baseCost.toLocaleString("id-ID")}
                </span>{" "}
                • <span>Margin EO: Rp{eoMargin.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "var(--space-4)",
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
              size="lg"
              loading={isSubmitting}
              loadingLabel="Memvalidasi & Mengirim..."
              onClick={handleSubmitForReview}
            >
              Submit untuk Review Admin &rarr;
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
