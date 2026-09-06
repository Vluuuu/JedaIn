import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Badge, Button, Dialog } from "../../components/ui";
import { mockDestinationStore } from "./mockDestinationStore";
import { mockEoPackageStore } from "./mockEoPackageStore";
import { mockInsightStore } from "./mockInsightStore";
import { partnerSessionStore } from "./partnerSessionStore";
import type {
  DestinationRecord,
  DemandInsightRecord,
  EoItineraryItem,
  EoValidationError,
  PackageGuideSource,
} from "./types";
import "./eo.css";

const STEPS = [
  { step: 1, label: "1. Destinasi & Pemandu" },
  { step: 2, label: "2. Sinyal Insight" },
  { step: 3, label: "3. Rencana Itinerary" },
  { step: 4, label: "4. Skema Harga" },
  { step: 5, label: "5. Tinjau & Submit" },
] as const;

export function EoPackageBuilderScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialInsightId = searchParams.get("insightId");
  const initialDestinationId = searchParams.get("destinationId");
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

  // Available data - Step 1 uses authoritative eligible destinations
  const eligibleDestinations =
    mockDestinationStore.getEligibleForEo(guideStatus);
  const allInsights = mockInsightStore.getAllInsights();

  // Authoritative initial destination: preselect only if the candidate is in eligibleDestinations
  const candidateDestinationId =
    initialDraft?.destinationId ?? initialDestinationId ?? "";
  const isCandidateEligible = eligibleDestinations.some(
    (d) => d.destinationId === candidateDestinationId,
  );
  const initialValidDestinationId = isCandidateEligible
    ? candidateDestinationId
    : "";

  // Step 1: Destination Selection & Filtering
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>(
    initialValidDestinationId,
  );
  const [destSearchQuery, setDestSearchQuery] = useState<string>("");
  const [destLevelFilter, setDestLevelFilter] = useState<
    "ALL" | "BASIC" | "PLUS"
  >("ALL");

  // Step 1: Destination Inspect Dialog / Modal
  const [inspectingDestination, setInspectingDestination] = useState<
    DestinationRecord | undefined
  >(undefined);

  // Step 1: Guide Source Selection
  // CONCEPT_ONLY must be DESTINATION; CERTIFIED_GUIDE can choose DESTINATION or EO
  const [guideSource, setGuideSource] = useState<PackageGuideSource>(
    initialDraft?.guideSource ?? "DESTINATION",
  );

  // Form State
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

  const filteredEligibleDestinations = eligibleDestinations.filter((dest) => {
    if (
      destLevelFilter !== "ALL" &&
      dest.verificationLevel !== destLevelFilter
    ) {
      return false;
    }
    if (destSearchQuery.trim()) {
      const q = destSearchQuery.toLowerCase().trim();
      const matchesName = dest.name.toLowerCase().includes(q);
      const matchesCity = dest.city.toLowerCase().includes(q);
      const matchesLoc = dest.locationLabel.toLowerCase().includes(q);
      if (!matchesName && !matchesCity && !matchesLoc) return false;
    }
    return true;
  });

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
    eligibleDestinations.find((d) => d.destinationId === selectedDestinationId);
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

    // Enforce Concept-Only rule on save: must use DESTINATION
    const effectiveGuideSource: PackageGuideSource =
      guideStatus === "CONCEPT_ONLY" ? "DESTINATION" : guideSource;

    // Only persist destinationId if it is authoritative and eligible
    const effectiveDestinationId = selectedDestination
      ? selectedDestination.destinationId
      : "";

    const res = mockEoPackageStore.saveDraft({
      packageId,
      title,
      shortSummary,
      valueProposition: shortSummary,
      destinationId: effectiveDestinationId,
      insightId: selectedInsightId,
      durationLabel,
      itinerary,
      safetyNotes: splitSafety,
      guideSource: effectiveGuideSource,
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
      .map((item, i) => ({ ...item, order: i + 1 }));
    setItinerary(updated);
  };

  const handleUpdateItinerary = (
    index: number,
    field: keyof EoItineraryItem,
    value: string,
  ) => {
    const updated = [...itinerary];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setItinerary(updated);
  };

  const handleSubmitForReview = () => {
    setIsSubmitting(true);
    setValidationErrors([]);

    const savedPkg = saveCurrentDraft();
    if (!savedPkg) {
      setIsSubmitting(false);
      return;
    }

    const res = mockEoPackageStore.submitForReview(savedPkg.packageId);
    setIsSubmitting(false);

    if (res.success) {
      navigate(`/partner/eo/packages/${savedPkg.packageId}`);
    } else {
      setValidationErrors(res.validationResult.errors);
      if (res.validationResult.errors.length > 0) {
        setCurrentStep(res.validationResult.errors[0].step);
      }
    }
  };

  return (
    <div className="eo-container">
      {/* Page Header */}
      <header className="eo-page-header">
        <div>
          <h1 className="eo-page-title">Rancang Paket Experience</h1>
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
            className={`eo-step-item ${
              currentStep === s.step
                ? "eo-step-item--active"
                : currentStep > s.step
                  ? "eo-step-item--completed"
                  : ""
            }`}
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

      {/* STEP 1: DESTINATION & GUIDE SOURCE */}
      {currentStep === 1 && (
        <section
          className="eo-section"
          aria-label="Pilih destinasi dan kepemanduan"
        >
          <div className="eo-section-header">
            <div>
              <h2 className="eo-section-title">
                Langkah 1: Pilih Destinasi & Status Pemanduan
              </h2>
              <p
                style={{
                  margin: "var(--space-1) 0 0",
                  fontSize: "var(--font-size-body-sm)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Pilih tempat yang menjadi dasar experience yang ingin kamu
                rancang.
              </p>
            </div>
          </div>

          {/* Destination Search & Filter */}
          <div className="eo-builder-dest-toolbar">
            <input
              type="search"
              placeholder="Cari nama atau area destinasi…"
              value={destSearchQuery}
              onChange={(e) => setDestSearchQuery(e.target.value)}
              className="eo-builder-dest-search"
              aria-label="Cari destinasi dalam perancang paket"
            />
            <div className="eo-builder-dest-chips" role="tablist">
              <button
                type="button"
                className={`eo-dest-chip ${destLevelFilter === "ALL" ? "eo-dest-chip--active" : ""}`}
                onClick={() => setDestLevelFilter("ALL")}
                role="tab"
                aria-selected={destLevelFilter === "ALL"}
              >
                Semua
              </button>
              <button
                type="button"
                className={`eo-dest-chip ${destLevelFilter === "PLUS" ? "eo-dest-chip--active" : ""}`}
                onClick={() => setDestLevelFilter("PLUS")}
                role="tab"
                aria-selected={destLevelFilter === "PLUS"}
              >
                Terverifikasi Plus
              </button>
              <button
                type="button"
                className={`eo-dest-chip ${destLevelFilter === "BASIC" ? "eo-dest-chip--active" : ""}`}
                onClick={() => setDestLevelFilter("BASIC")}
                role="tab"
                aria-selected={destLevelFilter === "BASIC"}
              >
                Terverifikasi Dasar
              </button>
            </div>
          </div>

          {/* Destination Cards */}
          <div className="eo-builder-dest-grid">
            {filteredEligibleDestinations.map((dest) => {
              const isSelected = selectedDestinationId === dest.destinationId;

              return (
                <article
                  key={dest.destinationId}
                  className={`eo-builder-dest-card ${
                    isSelected ? "eo-builder-dest-card--selected" : ""
                  }`}
                  aria-label={`Destinasi: ${dest.name}`}
                >
                  {/* Media */}
                  <div className="eo-builder-dest-card__media">
                    {dest.imageUrl ? (
                      <img
                        src={dest.imageUrl}
                        alt={dest.name}
                        className="eo-builder-dest-card__img"
                      />
                    ) : (
                      <div className="eo-builder-dest-card__img-placeholder" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="eo-builder-dest-card__body">
                    <div>
                      <h3 className="eo-builder-dest-card__title">
                        {dest.name}
                      </h3>

                      <div className="eo-builder-dest-card__badges">
                        <Badge
                          tone={
                            dest.verificationLevel === "PLUS"
                              ? "info"
                              : "success"
                          }
                          showSymbol={false}
                        >
                          {dest.verificationLevel === "PLUS"
                            ? "Terverifikasi Plus"
                            : "Terverifikasi Dasar"}
                        </Badge>
                        <span className="eo-builder-dest-card__guide-badge">
                          Pemandu lokal tersedia
                        </span>
                      </div>

                      <p className="eo-builder-dest-card__loc">
                        {dest.locationLabel}
                      </p>
                      <p className="eo-builder-dest-card__desc">
                        {dest.description}
                      </p>
                    </div>

                    <div className="eo-builder-dest-card__meta">
                      <span className="eo-builder-dest-card__price">
                        Biaya dasar:{" "}
                        <strong>
                          Rp{dest.baseCostPerPerson.toLocaleString("id-ID")}
                        </strong>
                      </span>
                    </div>

                    {/* Actions: Inspect Detail vs Select */}
                    <div className="eo-builder-dest-card__actions">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectingDestination(dest);
                        }}
                      >
                        Lihat Detail
                      </Button>
                      <Button
                        type="button"
                        variant={isSelected ? "primary" : "secondary"}
                        size="sm"
                        onClick={() =>
                          setSelectedDestinationId(dest.destinationId)
                        }
                      >
                        {isSelected ? "Terpilih ✓" : "Pilih"}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Guide Source Selection Section */}
          <div className="eo-builder-guide-section">
            <h3 className="eo-builder-guide-title">
              Siapa yang akan memandu experience ini?
            </h3>

            {guideStatus === "CONCEPT_ONLY" ? (
              <div className="eo-builder-guide-card eo-builder-guide-card--locked">
                <div className="eo-builder-guide-card__header">
                  <strong>Pemandu dari Destinasi</strong>
                  <Badge tone="success">Tersedia melalui mitra destinasi</Badge>
                </div>
                <p className="eo-builder-guide-card__desc">
                  Kamu fokus merancang experience. Pemanduan akan disiapkan oleh
                  mitra destinasi terverifikasi di lokasi.
                </p>
              </div>
            ) : (
              <div className="eo-builder-guide-options">
                <label
                  className={`eo-builder-guide-card ${
                    guideSource === "DESTINATION"
                      ? "eo-builder-guide-card--active"
                      : ""
                  }`}
                >
                  <div className="eo-builder-guide-card__header">
                    <input
                      type="radio"
                      name="guide-source"
                      value="DESTINATION"
                      checked={guideSource === "DESTINATION"}
                      onChange={() => setGuideSource("DESTINATION")}
                    />
                    <strong>Pemandu dari Destinasi</strong>
                  </div>
                  <p className="eo-builder-guide-card__desc">
                    Pemanduan dilakukan oleh tim lokal yang disiapkan pihak
                    destinasi.
                  </p>
                </label>

                <label
                  className={`eo-builder-guide-card ${
                    guideSource === "EO" ? "eo-builder-guide-card--active" : ""
                  }`}
                >
                  <div className="eo-builder-guide-card__header">
                    <input
                      type="radio"
                      name="guide-source"
                      value="EO"
                      checked={guideSource === "EO"}
                      onChange={() => setGuideSource("EO")}
                    />
                    <strong>Pemandu dari EO (Certified Guide)</strong>
                  </div>
                  <p className="eo-builder-guide-card__desc">
                    Pemanduan dipimpin langsung oleh tim EO yang memiliki
                    sertifikasi kepemanduan resmi.
                  </p>
                </label>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "var(--space-6)",
            }}
          >
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={!selectedDestination}
              onClick={handleNext}
            >
              Lanjut ke Langkah 2: Sinyal Insight
            </Button>
          </div>
        </section>
      )}

      {/* STEP 2: RELEVANT INSIGHT */}
      {currentStep === 2 && (
        <section
          className="eo-section"
          aria-label="Pilih sinyal kebutuhan traveler"
        >
          <div className="eo-section-header">
            <div>
              <h2 className="eo-section-title">
                Langkah 2: Hubungkan dengan Sinyal Kebutuhan Traveler
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--font-size-body-sm)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Pilih demand insight sebagai arahan perancangan paket (opsional,
                membantu relevansi kurasi).
              </p>
            </div>
          </div>

          <div>
            <div
              style={{
                display: "grid",
                gap: "var(--space-3)",
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
              Kembali
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleNext}
            >
              Lanjut ke Langkah 3: Itinerary
            </Button>
          </div>
        </section>
      )}

      {/* STEP 3: ITINERARY BUILDER */}
      {currentStep === 3 && (
        <section
          className="eo-section"
          aria-label="Rencana itinerary aktivitas"
        >
          <div className="eo-section-header">
            <div>
              <h2 className="eo-section-title">
                Langkah 3: Rencana Alur Aktivitas (Itinerary)
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
            <label htmlFor="safety-notes" className="eo-form-label">
              Catatan Keselamatan & Perlengkapan Wajib *
            </label>
            <textarea
              id="safety-notes"
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
              Kembali
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleNext}
            >
              Lanjut ke Langkah 4: Skema Harga
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
                  Harga Traveler = Biaya Dasar Destinasi + Margin EO
                </strong>
                .
              </p>
            </div>
          </div>

          <div className="eo-form-group">
            <label htmlFor="eo-margin-input" className="eo-form-label">
              Margin EO (Rp / Orang) *
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
              Mencakup layanan pengalaman, fasilitas pendukung, koordinasi sesi,
              dan konsumsi.
            </span>
          </div>

          {/* Pricing Breakdown Card */}
          <div className="eo-pricing-summary">
            <h3 style={{ fontSize: "var(--font-size-heading-sm)", margin: 0 }}>
              Rincian Transparansi Harga
            </h3>

            <div className="eo-pricing-row">
              <span>
                Biaya Dasar Destinasi (
                {selectedDestination?.name ?? "Destinasi"}):
              </span>
              <strong>Rp{baseCost.toLocaleString("id-ID")}</strong>
            </div>

            <div className="eo-pricing-row">
              <span>Margin EO:</span>
              <strong>Rp{eoMargin.toLocaleString("id-ID")}</strong>
            </div>

            <div className="eo-pricing-row eo-pricing-row--total">
              <span>Harga Traveler (Customer Price):</span>
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
              Kembali
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleNext}
            >
              Lanjut ke Langkah 5: Tinjau & Submit
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
                <Badge tone="neutral">
                  {guideSource === "DESTINATION"
                    ? "Pemandu Destinasi"
                    : "Pemandu EO"}
                </Badge>
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
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Preview */}
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
                  Harga Traveler:
                </small>
                <div
                  style={{
                    fontSize: "var(--font-size-heading-md)",
                    fontWeight: "bold",
                    color: "var(--color-brand-primary)",
                  }}
                >
                  Rp{customerPrice.toLocaleString("id-ID")}{" "}
                  <span
                    style={{
                      fontSize: "var(--font-size-body-sm)",
                      fontWeight: "normal",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    / orang
                  </span>
                </div>
              </div>

              <div
                style={{
                  textAlign: "right",
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-secondary)",
                }}
              >
                <span>Biaya Dasar: Rp{baseCost.toLocaleString("id-ID")}</span> •{" "}
                <span>Margin EO: Rp{eoMargin.toLocaleString("id-ID")}</span>
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
              Kembali
            </Button>

            <Button
              type="button"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              loadingLabel="Memvalidasi & Mengirim..."
              onClick={handleSubmitForReview}
            >
              Submit untuk Review Admin
            </Button>
          </div>
        </section>
      )}

      {/* Inspection Modal / Drawer for Destination in Step 1 */}
      {inspectingDestination && (
        <Dialog
          open={Boolean(inspectingDestination)}
          title={inspectingDestination.name}
          description={inspectingDestination.locationLabel}
          onClose={() => setInspectingDestination(undefined)}
          actions={
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setInspectingDestination(undefined)}
              >
                Tutup
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => {
                  setSelectedDestinationId(inspectingDestination.destinationId);
                  setInspectingDestination(undefined);
                }}
              >
                Pilih Destinasi Ini
              </Button>
            </div>
          }
        >
          <div className="eo-dest-inspect-dialog">
            {inspectingDestination.imageUrl && (
              <div className="eo-dest-inspect-media">
                <img
                  src={inspectingDestination.imageUrl}
                  alt={inspectingDestination.name}
                  className="eo-dest-inspect-img"
                />
              </div>
            )}

            <div className="eo-dest-inspect-body">
              <div className="eo-dest-inspect-badges">
                <Badge
                  tone={
                    inspectingDestination.verificationLevel === "PLUS"
                      ? "info"
                      : "success"
                  }
                  showSymbol={false}
                >
                  {inspectingDestination.verificationLevel === "PLUS"
                    ? "Terverifikasi Plus"
                    : "Terverifikasi Dasar"}
                </Badge>
                <span className="eo-dest-inspect-guide-badge">
                  Pemandu lokal tersedia
                </span>
              </div>

              <p>{inspectingDestination.description}</p>

              {inspectingDestination.availableActivities && (
                <div className="eo-dest-inspect-section">
                  <strong>Aktivitas yang Tersedia:</strong>
                  <ul>
                    {inspectingDestination.availableActivities.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}

              {inspectingDestination.facilities && (
                <div className="eo-dest-inspect-section">
                  <strong>Fasilitas:</strong>
                  <ul>
                    {inspectingDestination.facilities.map((fac, i) => (
                      <li key={i}>{fac}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="eo-dest-inspect-footer">
                <span>
                  Biaya dasar destinasi:{" "}
                  <strong>
                    Rp
                    {inspectingDestination.baseCostPerPerson.toLocaleString(
                      "id-ID",
                    )}{" "}
                    / orang
                  </strong>
                </span>
                <span>
                  Kapasitas:{" "}
                  <strong>
                    {inspectingDestination.capacityPerSession} orang
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
