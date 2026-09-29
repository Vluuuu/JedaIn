import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { destinationRepository } from "../../data/destinationRepository";
import { packageRepository } from "../../data/packageRepository";
import { Badge, Button, Dialog } from "../../components/ui";
import { getDestinationVisual } from "../../lib/assets/packageImages";
import { isSupabaseMode } from "../../lib/supabase/config";
import { mockDestinationStore } from "./mockDestinationStore";
import { mockEoPackageStore } from "./mockEoPackageStore";
import { mockInsightStore } from "./mockInsightStore";
import { validatePackageImageFile } from "./packageImageValidation";
import { partnerSessionStore } from "./partnerSessionStore";
import type {
  DestinationRecord,
  DemandInsightRecord,
  EoItineraryItem,
  EoPackageRecord,
  EoValidationError,
  PackageGuideSource,
} from "./types";
import "./eo.css";

const STEPS = [
  { step: 1, label: "Destinasi & Pemandu" },
  { step: 2, label: "Sinyal Insight" },
  { step: 3, label: "Perjalanan & Itinerary" },
  { step: 4, label: "Skema Harga" },
  { step: 5, label: "Tinjau & Submit" },
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
    initialDraft?.packageId ?? draftId ?? undefined,
  );
  const packageIdRef = useRef<string | undefined>(
    initialDraft?.packageId ?? draftId ?? undefined,
  );
  const saveQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  // Available data - Step 1 uses authoritative eligible destinations
  const [eligibleDestinations, setEligibleDestinations] = useState<
    DestinationRecord[]
  >(() => [...mockDestinationStore.getEligibleForEo(guideStatus)]);

  useEffect(() => {
    let isMounted = true;
    destinationRepository.getEligibleForEo(guideStatus).then((res) => {
      if (isMounted) setEligibleDestinations(res);
    });
    return () => {
      isMounted = false;
    };
  }, [guideStatus]);
  const allInsights = mockInsightStore.getAllInsights();
  const pricingBudgetDistribution = mockInsightStore.getBudgetDistribution({
    period: "ALL",
  });
  const pricingReferenceTotalResponses = mockInsightStore.getTotalResponses({
    period: "ALL",
  });
  const topPricingBudget = [...pricingBudgetDistribution].sort(
    (a, b) => b.percentage - a.percentage,
  )[0];

  // Authoritative initial destination: preselect only if the candidate is in eligibleDestinations
  const candidateDestinationId =
    initialDestinationId || initialDraft?.destinationId || "";
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
  const [destLocationFilter, setDestLocationFilter] = useState<string>("ALL");

  const destinationLocationOptions = Array.from(
    new Map(
      eligibleDestinations.map((dest) => [
        dest.city,
        { value: dest.city, label: `${dest.city}, ${dest.province}` },
      ]),
    ).values(),
  ).sort((a, b) => a.label.localeCompare(b.label, "id-ID"));

  // Step 4: Optional demand-assisted pricing reference
  const [showPricingReference, setShowPricingReference] = useState(false);

  // Step 5: Traveler-Facing Draft Preview Dialog
  const [showTravelerPreview, setShowTravelerPreview] = useState(false);

  // Step 1: Guide Source Selection
  // CONCEPT_ONLY must be DESTINATION; CERTIFIED_GUIDE can choose DESTINATION or EO
  const [guideSource, setGuideSource] = useState<PackageGuideSource>(
    initialDraft?.guideSource ?? "DESTINATION",
  );

  // Form State
  const [selectedInsightId, setSelectedInsightId] = useState<
    string | undefined
  >(initialDraft?.insightId ?? initialInsightId ?? undefined);
  const [insightAppliedMessage, setInsightAppliedMessage] = useState<boolean>(
    Boolean(initialDraft?.insightId || initialInsightId),
  );
  const [title, setTitle] = useState<string>(
    initialDraft?.title ?? initialInsight?.title ?? "",
  );
  const [shortSummary, setShortSummary] = useState<string>(
    initialDraft?.shortSummary ??
      initialDraft?.valueProposition ??
      (initialInsight
        ? `Experience untuk traveler yang mencari ${initialInsight.intentLabel}, dengan fokus pada ${initialInsight.recommendedFocus.join(", ")} di area ${initialInsight.targetArea}.`
        : ""),
  );
  const [durationLabel, setDurationLabel] = useState<string>(
    initialDraft?.durationLabel ?? initialInsight?.durationLabel ?? "1 hari",
  );
  const titleAuthoredRef = useRef(
    Boolean(initialDraft?.title && initialDraft.title.trim().length > 0),
  );
  const summaryAuthoredRef = useRef(
    Boolean(
      (initialDraft?.shortSummary || initialDraft?.valueProposition) &&
      (initialDraft.shortSummary || initialDraft.valueProposition)!.trim()
        .length > 0,
    ),
  );
  const durationAuthoredRef = useRef(
    Boolean(
      initialDraft?.durationLabel &&
      initialDraft.durationLabel !== initialInsight?.durationLabel,
    ),
  );
  const itineraryAuthoredRef = useRef(
    Boolean(initialDraft?.itinerary && initialDraft.itinerary.length > 0),
  );
  const [imageUrls, setImageUrls] = useState<string[]>(
    initialDraft?.imageUrls?.length
      ? initialDraft.imageUrls
      : initialDraft?.imageUrl
        ? [initialDraft.imageUrl]
        : [],
  );
  const [coverUrl, setCoverUrl] = useState<string | undefined>(
    initialDraft?.imageUrl,
  );
  const imageUrl =
    coverUrl && imageUrls.includes(coverUrl) ? coverUrl : imageUrls[0];
  const [imageError, setImageError] = useState<string | undefined>();
  const [itinerary, setItinerary] = useState<EoItineraryItem[]>(
    initialDraft?.itinerary && initialDraft.itinerary.length > 0
      ? initialDraft.itinerary
      : initialInsight?.sampleActivities?.length
        ? initialInsight.sampleActivities.map((activity, index) => ({
            order: index + 1,
            title: activity,
            description:
              "Aktivitas referensi dari Demand Insight. Sesuaikan detail pelaksanaan dengan destinasi dan konsep EO.",
            timeOfDayLabel:
              index === 0 ? "Pagi" : index === 1 ? "Siang" : "Sore",
            durationLabel: "1 jam",
          }))
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
    initialDraft?.safetyNotes ? initialDraft.safetyNotes.join("\n") : "",
  );
  const [meetingPointLabel, setMeetingPointLabel] = useState<string>(
    initialDraft?.meetingPointLabel ?? "",
  );
  const [departureTimeLabel, setDepartureTimeLabel] = useState<string>(
    initialDraft?.departureTimeLabel ?? "",
  );
  const [outboundTransport, setOutboundTransport] = useState<string>(
    initialDraft?.outboundTransport ?? "",
  );
  const [returnTransport, setReturnTransport] = useState<string>(
    initialDraft?.returnTransport ?? "",
  );
  const [includedItemsText, setIncludedItemsText] = useState<string>(
    initialDraft?.includedItems ? initialDraft.includedItems.join("\n") : "",
  );
  const [excludedItemsText, setExcludedItemsText] = useState<string>(
    initialDraft?.excludedItems ? initialDraft.excludedItems.join("\n") : "",
  );
  const [accessNotesText, setAccessNotesText] = useState<string>(
    initialDraft?.accessNotes ? initialDraft.accessNotes.join("\n") : "",
  );
  const [eoMargin, setEoMargin] = useState<number>(
    initialDraft?.pricing?.eoMargin ?? 150000,
  );
  const [validationErrors, setValidationErrors] = useState<EoValidationError[]>(
    [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const validationAlertRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (validationErrors.length > 0 && validationAlertRef.current) {
      validationAlertRef.current.scrollIntoView?.({
        behavior: "smooth",
        block: "start",
      });
      validationAlertRef.current.focus?.();
    }
  }, [validationErrors]);

  const filteredEligibleDestinations = eligibleDestinations.filter((dest) => {
    if (destLocationFilter !== "ALL" && dest.city !== destLocationFilter) {
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
            Draf paket ini tidak ditemukan atau bukan milik akun Travel
            Organizer Anda.
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

  const handleInsightChoice = (insight: DemandInsightRecord) => {
    const isSelected = selectedInsightId === insight.insightId;
    if (isSelected) {
      setSelectedInsightId(undefined);
      setInsightAppliedMessage(false);
      return;
    }

    setSelectedInsightId(insight.insightId);
    setShowPricingReference(true);
    setInsightAppliedMessage(true);

    if (!titleAuthoredRef.current) {
      setTitle(insight.title);
    }

    if (!summaryAuthoredRef.current) {
      setShortSummary(
        `Experience untuk traveler yang mencari ${insight.intentLabel}, dengan fokus pada ${insight.recommendedFocus.join(", ")} di area ${insight.targetArea}.`,
      );
    }

    if (!durationAuthoredRef.current) {
      setDurationLabel(insight.durationLabel);
    }

    if (
      !itineraryAuthoredRef.current &&
      insight.sampleActivities &&
      insight.sampleActivities.length > 0
    ) {
      setItinerary(
        insight.sampleActivities.map((activity, index) => ({
          order: index + 1,
          title: activity,
          description:
            "Aktivitas referensi dari Demand Insight. Sesuaikan detail pelaksanaan dengan destinasi dan konsep Travel Organizer.",
          timeOfDayLabel: index === 0 ? "Pagi" : index === 1 ? "Siang" : "Sore",
          durationLabel: "1 jam",
        })),
      );
    }
  };

  const effectiveGuideSource: PackageGuideSource =
    guideStatus === "CONCEPT_ONLY" ? "DESTINATION" : guideSource;
  const baseCost = selectedDestination?.baseCostPerPerson ?? 100000;
  const localGuideFee =
    effectiveGuideSource === "DESTINATION"
      ? (selectedDestination?.localGuideFeePerPerson ?? 0)
      : 0;
  const customerPrice = baseCost + localGuideFee + eoMargin;

  // Authoritative draft save serialized via promise chain to prevent race conditions & duplicate drafts
  const saveCurrentDraft = async (): Promise<EoPackageRecord | undefined> => {
    let savedRecord: EoPackageRecord | undefined;

    const task = saveQueueRef.current
      .catch(() => {})
      .then(async () => {
        const splitSafety = safetyNotes
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

        const splitIncluded = includedItemsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

        const splitExcluded = excludedItemsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

        const splitAccessNotes = accessNotesText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

        // Only persist destinationId if it is authoritative and eligible
        const effectiveDestinationId = selectedDestination
          ? selectedDestination.destinationId
          : "";

        const currentPackageId = packageIdRef.current;

        const draftPayload: Partial<EoPackageRecord> = {
          packageId: currentPackageId,
          title,
          shortSummary,
          valueProposition: shortSummary,
          destinationId: effectiveDestinationId,
          imageUrl,
          imageUrls,
          insightId: selectedInsightId,
          durationLabel,
          itinerary,
          meetingPointLabel: meetingPointLabel.trim() || undefined,
          departureTimeLabel: departureTimeLabel.trim() || undefined,
          outboundTransport: outboundTransport.trim() || undefined,
          returnTransport: returnTransport.trim() || undefined,
          includedItems: splitIncluded,
          excludedItems: splitExcluded,
          safetyNotes: splitSafety,
          accessNotes:
            splitAccessNotes.length > 0 ? splitAccessNotes : undefined,
          guideSource: effectiveGuideSource,
          pricing: {
            destinationBaseCost: baseCost,
            localGuideFee,
            eoMargin,
            customerPrice,
          },
        };

        const res = await packageRepository.saveDraft(draftPayload);
        if (res.success && res.package) {
          const authoritativeId = res.package.packageId;
          packageIdRef.current = authoritativeId;
          setPackageId(authoritativeId);
          savedRecord = res.package;
          return;
        }

        // Fallback for mock-only testing mode when repository session is unauthenticated
        if (!isSupabaseMode()) {
          const mockRes = mockEoPackageStore.saveDraft(draftPayload);
          if (mockRes.success && mockRes.package) {
            const fallbackId = mockRes.package.packageId;
            packageIdRef.current = fallbackId;
            setPackageId(fallbackId);
            savedRecord = mockRes.package;
          }
        }
      });

    saveQueueRef.current = task;
    await task;
    return savedRecord;
  };

  const processImageFile = (file: File) => {
    const validation = validatePackageImageFile(file);
    if (!validation.valid) {
      setImageError(validation.error);
      return;
    }

    setImageError(undefined);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        setImageUrls((current) =>
          current.includes(result) ? current : [...current, result],
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(processImageFile);
    e.currentTarget.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    Array.from(e.dataTransfer.files ?? []).forEach(processImageFile);
  };

  const handleNext = async () => {
    await saveCurrentDraft();
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = async () => {
    await saveCurrentDraft();
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Itinerary helpers
  const handleAddItinerary = () => {
    itineraryAuthoredRef.current = true;
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
    itineraryAuthoredRef.current = true;
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
    itineraryAuthoredRef.current = true;
    const updated = [...itinerary];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setItinerary(updated);
  };

  const handleSubmitForReview = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      const savedPkg = await saveCurrentDraft();
      if (!savedPkg) {
        setIsSubmitting(false);
        return;
      }

      const res = await packageRepository.submitForReview(savedPkg.packageId);
      setIsSubmitting(false);

      if (res.success) {
        navigate(`/partner/eo/packages/${savedPkg.packageId}`);
      } else {
        setValidationErrors(res.validationResult.errors);
        if (res.validationResult.errors.length > 0) {
          setCurrentStep(res.validationResult.errors[0].step);
        }
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="eo-container" data-package-id={packageId}>
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
            onClick={async () => {
              await saveCurrentDraft();
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
        <div
          ref={validationAlertRef}
          tabIndex={-1}
          className="eo-alert eo-alert--error"
          role="alert"
          style={{ outline: "none" }}
        >
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
            <div className="eo-builder-dest-toolbar__search-group">
              <input
                type="search"
                placeholder="Cari nama atau area destinasi…"
                value={destSearchQuery}
                onChange={(e) => setDestSearchQuery(e.target.value)}
                className="eo-builder-dest-search"
                aria-label="Cari destinasi dalam perancang paket"
              />
              <label
                htmlFor="destination-location-filter"
                className="eo-builder-dest-location-label"
              >
                Lokasi
              </label>
              <select
                id="destination-location-filter"
                className="eo-form-select eo-builder-dest-location-select"
                value={destLocationFilter}
                onChange={(e) => setDestLocationFilter(e.target.value)}
              >
                <option value="ALL">Semua Lokasi</option>
                {destinationLocationOptions.map((location) => (
                  <option key={location.value} value={location.value}>
                    {location.label}
                  </option>
                ))}
              </select>
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
                    <img
                      src={
                        dest.imageUrl ||
                        getDestinationVisual(dest.name).svgDataUri
                      }
                      alt={dest.name}
                      className="eo-builder-dest-card__img"
                      loading="lazy"
                    />
                  </div>

                  {/* Body */}
                  <div className="eo-builder-dest-card__body">
                    <div>
                      <h3 className="eo-builder-dest-card__title">
                        {dest.name}
                      </h3>

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
                      <span className="eo-builder-dest-card__price">
                        Tarif pemandu lokal:{" "}
                        <strong>
                          Rp
                          {(dest.localGuideFeePerPerson ?? 0).toLocaleString(
                            "id-ID",
                          )}
                        </strong>{" "}
                        / orang
                      </span>
                    </div>

                    {/* Actions: Inspect Detail vs Select */}
                    <div className="eo-builder-dest-card__actions">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const savedPkg = await saveCurrentDraft();
                          const params = new URLSearchParams({
                            from: "builder",
                          });
                          if (savedPkg?.packageId) {
                            params.set("draftId", savedPkg.packageId);
                          }
                          navigate(
                            `/partner/eo/destinations/${dest.destinationId}?${params.toString()}`,
                          );
                        }}
                      >
                        Lihat Detail Destinasi
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
                  {selectedDestination?.localGuideSummary && (
                    <p
                      style={{
                        margin: "var(--space-2) 0 0",
                        fontSize: "var(--font-size-caption)",
                        color: "var(--color-text-secondary)",
                        fontStyle: "italic",
                      }}
                    >
                      Karakter pemandu: &ldquo;
                      {selectedDestination.localGuideSummary}&rdquo;
                    </p>
                  )}
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
                    <strong>
                      Pemandu dari Travel Organizer (Certified Guide)
                    </strong>
                  </div>
                  <p className="eo-builder-guide-card__desc">
                    Pemanduan dipimpin langsung oleh tim Travel Organizer yang
                    memiliki sertifikasi kepemanduan resmi.
                  </p>
                </label>
              </div>
            )}
            <p
              style={{
                marginTop: "var(--space-3)",
                fontSize: "var(--font-size-caption)",
                color: "var(--color-text-secondary)",
                lineHeight: 1.4,
              }}
            >
              Catatan: Pilihan ini menunjukkan sumber pemandu untuk package
              (Destinasi atau Travel Organizer), bukan penugasan pemandu
              individu pada sesi tertentu.
            </p>
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
                Sinyal Insight Traveler
                <span className="sr-only">
                  {" "}
                  (Langkah 2: Hubungkan dengan Sinyal Kebutuhan Traveler)
                </span>
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--font-size-body-sm)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Gunakan insight sebagai titik awal rancangan. Sistem akan
                mengisi beberapa bagian draft berdasarkan pola preferensi
                simulasi, lalu kamu tetap bebas mengubahnya.
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
                    style={{ padding: "var(--space-4)" }}
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
                      onClick={() => handleInsightChoice(ins)}
                    >
                      {isInsSelected ? (
                        <>
                          Arahan digunakan ✓
                          <span className="sr-only">
                            {" "}
                            (Dipakai sebagai arahan ✓)
                          </span>
                        </>
                      ) : (
                        "Terapkan ke draft"
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {insightAppliedMessage && selectedInsight && (
            <div
              className="admin-alert admin-alert--success"
              style={{ marginTop: "var(--space-3)" }}
              role="status"
            >
              <strong>Arahan diterapkan ke draft</strong>
              <p
                style={{
                  margin: "var(--space-1) 0 0",
                  fontSize: "var(--font-size-body-sm)",
                }}
              >
                Judul, durasi, dan ide itinerary telah diisi sebagai titik awal.
                Semua bagian tetap dapat kamu ubah.
              </p>
            </div>
          )}

          {selectedInsight && (
            <div
              className="eo-insight-brief"
              aria-label="Arahan insight terpilih"
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "var(--space-2)",
                }}
              >
                <h3 style={{ margin: 0 }}>Arahan yang diterapkan</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedInsightId(undefined);
                    setInsightAppliedMessage(false);
                  }}
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: "var(--font-size-caption)",
                  }}
                >
                  Ganti insight
                </Button>
              </div>
              <p>
                Draft awal sudah diisi berdasarkan arahan ini. Periksa dan
                sesuaikan kembali dengan konsep Travel Organizer dan kondisi
                destinasi.
              </p>
              <dl>
                <div>
                  <dt>Kebutuhan traveler</dt>
                  <dd>{selectedInsight.intentLabel}</dd>
                </div>
                <div>
                  <dt>Area</dt>
                  <dd>{selectedInsight.targetArea}</dd>
                </div>
                <div>
                  <dt>Durasi referensi</dt>
                  <dd>{selectedInsight.durationLabel}</dd>
                </div>
                <div>
                  <dt>Budget</dt>
                  <dd>{selectedInsight.preferredBudgetRange}</dd>
                </div>
              </dl>
              <strong>Fokus</strong>
              <ul>
                {selectedInsight.recommendedFocus.map((focus) => (
                  <li key={focus}>{focus}</li>
                ))}
              </ul>
              <strong>Ide dari insight</strong>
              <ul>
                {selectedInsight.sampleActivities.map((activity) => (
                  <li key={activity}>{activity}</li>
                ))}
              </ul>
            </div>
          )}

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
              onChange={(e) => {
                titleAuthoredRef.current = true;
                setTitle(e.target.value);
              }}
              placeholder="Contoh: Sehari Pelan di Lereng Hijau"
            />
          </div>

          <div className="eo-form-group">
            <label htmlFor="package-summary" className="eo-form-label">
              Ringkasan Pengalaman *
            </label>
            <span className="eo-form-helper">
              Jelaskan dalam 1–2 kalimat pengalaman utama yang akan didapat
              Traveler. Hindari mengulang itinerary.
            </span>
            <textarea
              id="package-summary"
              rows={3}
              required
              className="eo-form-textarea"
              value={shortSummary}
              onChange={(e) => {
                summaryAuthoredRef.current = true;
                setShortSummary(e.target.value);
              }}
              placeholder="Contoh: Nikmati jeda sehari di lereng hijau dengan jalan santai, teh lokal, dan sesi refleksi ringan."
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
              onChange={(e) => {
                durationAuthoredRef.current = true;
                setDurationLabel(e.target.value);
              }}
            >
              <option value="Setengah hari">Setengah hari (4 - 5 jam)</option>
              <option value="1 hari">1 hari penuh (6 - 8 jam)</option>
              <option value="2 hari 1 malam">
                2 hari 1 malam (Retreat Menginap)
              </option>
            </select>
          </div>

          {/* Cover Photo / Foto Utama Experience */}
          <div className="eo-form-group">
            <label className="eo-form-label">Media Experience</label>
            <p
              style={{
                margin: "0 0 var(--space-2)",
                fontSize: "var(--font-size-caption)",
                color: "var(--color-text-secondary)",
              }}
            >
              Pilih beberapa visual destinasi dan tambahkan foto milik Travel
              Organizer. Tentukan satu sebagai cover paket.
            </p>

            {selectedDestination?.mediaGallery &&
              selectedDestination.mediaGallery.length > 0 && (
                <div className="eo-builder-destination-media">
                  <div className="eo-builder-destination-media__header">
                    <div>
                      <strong>Pilih dari galeri destinasi</strong>
                      <span>
                        Visual prototype diberi label jelas dan tidak diklaim
                        sebagai foto kondisi aktual.
                      </span>
                    </div>
                    <span>
                      {selectedDestination.mediaGallery.length} pilihan
                    </span>
                  </div>

                  <div
                    className="eo-builder-destination-media__grid"
                    role="group"
                    aria-label="Pilihan visual dari galeri destinasi"
                  >
                    {selectedDestination.mediaGallery.map((media) => {
                      const isSelected = imageUrls.includes(media.url);

                      return (
                        <button
                          key={media.mediaId}
                          type="button"
                          className={`eo-builder-destination-media__option${isSelected ? " eo-builder-destination-media__option--selected" : ""}`}
                          aria-pressed={isSelected}
                          onClick={() => {
                            setImageUrls((current) =>
                              current.includes(media.url)
                                ? current.filter((url) => url !== media.url)
                                : [...current, media.url],
                            );
                            if (isSelected && coverUrl === media.url)
                              setCoverUrl(undefined);
                            setImageError(undefined);
                          }}
                        >
                          <img src={media.url} alt="" aria-hidden="true" />
                          <span>
                            <strong>{media.label}</strong>
                            <small>
                              {media.provenance === "PROTOTYPE_ILLUSTRATION"
                                ? "Visual prototype"
                                : "Media destinasi"}
                            </small>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <p className="eo-builder-destination-media__or">
                    Pilihan galeri dapat digabung dengan foto milik Travel
                    Organizer sendiri.
                  </p>
                </div>
              )}

            <div
              className="eo-builder-dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="eo-builder-dropzone__icon"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p className="eo-builder-dropzone__text">
                Seret dan lepas foto Travel Organizer ke sini, atau klik tombol
                di bawah
              </p>
              <label className="eo-builder-upload-btn-label">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="eo-builder-file-input"
                  onChange={handleFileChange}
                  aria-label="Tambah foto milik Travel Organizer"
                />
                <span>Tambah foto milik Travel Organizer</span>
              </label>
              <span className="eo-builder-dropzone__hint">
                JPG, PNG, atau WebP · maksimal 5 MB per file.
              </span>
            </div>

            <div
              className="eo-builder-selected-media"
              aria-label="Media terpilih"
            >
              <strong>Media terpilih ({imageUrls.length})</strong>
              {imageUrls.length === 0 ? (
                <p>Belum ada media yang dipilih.</p>
              ) : (
                <div className="eo-builder-selected-media__grid">
                  {imageUrls.map((url, index) => (
                    <div className="eo-builder-selected-media__item" key={url}>
                      <img
                        src={url}
                        alt={`Media terpilih ${index + 1}`}
                        className="eo-builder-img-preview"
                      />
                      {imageUrl === url && <span>Cover package</span>}
                      <div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setCoverUrl(url)}
                        >
                          Jadikan cover
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setImageUrls((current) =>
                              current.filter((item) => item !== url),
                            );
                            if (coverUrl === url) setCoverUrl(undefined);
                          }}
                        >
                          Hapus media
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {imageError && (
              <p
                className="eo-builder-img-error"
                role="alert"
                style={{
                  margin: "var(--space-2) 0 0",
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-danger-text)",
                }}
              >
                {imageError}
              </p>
            )}
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
              Lanjut ke Langkah 3: Perjalanan & Itinerary
            </Button>
          </div>
        </section>
      )}

      {/* STEP 3: ITINERARY & LOGISTICS BUILDER */}
      {currentStep === 3 && (
        <section
          className="eo-section"
          aria-label="Rencana perjalanan dan alur itinerary"
        >
          <div className="eo-section-header">
            <div>
              <h2 className="eo-section-title">
                Langkah 3: Perjalanan & Alur Itinerary
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--font-size-body-sm)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Atur titik kumpul, transportasi, alur kegiatan, dan ketentuan
                paket untuk traveler.
              </p>
            </div>
          </div>

          {/* 1. Pengaturan Perjalanan & Titik Kumpul */}
          <div className="eo-builder-subgroup">
            <h3 className="eo-builder-subgroup__title">
              Pengaturan Perjalanan
            </h3>
            <p className="eo-builder-subgroup__desc">
              Jelaskan titik temu dan transportasi dari titik kumpul menuju
              destinasi dan kembali.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-3)",
              }}
            >
              <div className="eo-form-group">
                <label htmlFor="meeting-point" className="eo-form-label">
                  Titik Kumpul *
                </label>
                <input
                  id="meeting-point"
                  type="text"
                  required
                  className="eo-form-input"
                  value={meetingPointLabel}
                  onChange={(e) => setMeetingPointLabel(e.target.value)}
                  placeholder="Contoh: Lobby utama Stasiun Malang"
                />
              </div>

              <div className="eo-form-group">
                <label htmlFor="departure-time" className="eo-form-label">
                  Waktu Kumpul / Keberangkatan *
                </label>
                <input
                  id="departure-time"
                  type="text"
                  required
                  className="eo-form-input"
                  value={departureTimeLabel}
                  onChange={(e) => setDepartureTimeLabel(e.target.value)}
                  placeholder="Contoh: Peserta berkumpul 30 menit sebelum keberangkatan."
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-3)",
              }}
            >
              <div className="eo-form-group">
                <label htmlFor="outbound-transport" className="eo-form-label">
                  Transportasi Menuju Destinasi *
                </label>
                <input
                  id="outbound-transport"
                  type="text"
                  required
                  className="eo-form-input"
                  value={outboundTransport}
                  onChange={(e) => setOutboundTransport(e.target.value)}
                  placeholder="Contoh: Shuttle minibus dari titik kumpul menuju destinasi."
                />
              </div>

              <div className="eo-form-group">
                <label htmlFor="return-transport" className="eo-form-label">
                  Transportasi Kembali *
                </label>
                <input
                  id="return-transport"
                  type="text"
                  required
                  className="eo-form-input"
                  value={returnTransport}
                  onChange={(e) => setReturnTransport(e.target.value)}
                  placeholder="Contoh: Shuttle kembali ke titik kumpul setelah kegiatan selesai."
                />
              </div>
            </div>
          </div>

          {/* 2. Itinerary Activity Builder */}
          <div className="eo-builder-subgroup">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "var(--space-2)",
              }}
            >
              <div>
                <h3 className="eo-builder-subgroup__title">
                  Alur Aktivitas (Itinerary)
                </h3>
                <p className="eo-builder-subgroup__desc">
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
                    <label className="eo-form-label">
                      Deskripsi Aktivitas *
                    </label>
                    <textarea
                      rows={2}
                      required
                      className="eo-form-textarea"
                      value={item.description}
                      onChange={(e) =>
                        handleUpdateItinerary(
                          idx,
                          "description",
                          e.target.value,
                        )
                      }
                      placeholder="Ceritakan detail kegiatan mindful yang dilakukan traveler..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Cakupan Paket (Fasilitas & Ketentuan) */}
          <div className="eo-builder-subgroup">
            <h3 className="eo-builder-subgroup__title">Cakupan Paket</h3>
            <p className="eo-builder-subgroup__desc">
              Tentukan fasilitas yang sudah termasuk dan yang belum termasuk
              dalam paket.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-3)",
              }}
            >
              <div className="eo-form-group">
                <label htmlFor="included-items" className="eo-form-label">
                  Sudah Termasuk dalam Paket *
                </label>
                <textarea
                  id="included-items"
                  rows={4}
                  className="eo-form-textarea"
                  value={includedItemsText}
                  onChange={(e) => setIncludedItemsText(e.target.value)}
                  placeholder="Satu butir per baris (contoh: Transportasi PP dari titik kumpul, tiket masuk, pemandu)..."
                />
              </div>

              <div className="eo-form-group">
                <label htmlFor="excluded-items" className="eo-form-label">
                  Belum Termasuk
                </label>
                <textarea
                  id="excluded-items"
                  rows={4}
                  className="eo-form-textarea"
                  value={excludedItemsText}
                  onChange={(e) => setExcludedItemsText(e.target.value)}
                  placeholder="Satu butir per baris (contoh: Transportasi menuju titik kumpul awal, pengeluaran pribadi)..."
                />
              </div>
            </div>
          </div>

          {/* 4. Persiapan & Keselamatan */}
          <div className="eo-builder-subgroup">
            <h3 className="eo-builder-subgroup__title">
              Persiapan & Keselamatan
            </h3>
            <div className="eo-form-group">
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
                placeholder="Pisahkan dengan baris baru (contoh: alas kaki yang nyaman, pakaian hangat, dsb)..."
              />
            </div>

            <div className="eo-form-group">
              <label htmlFor="access-notes" className="eo-form-label">
                Catatan Akses Lokasi Tambahan (Opsional)
              </label>
              <textarea
                id="access-notes"
                rows={2}
                className="eo-form-textarea"
                value={accessNotesText}
                onChange={(e) => setAccessNotesText(e.target.value)}
                placeholder="Petunjuk akses kendaraan atau patokan lokasi..."
              />
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
                Harga package per orang:{" "}
                <strong>
                  Biaya Dasar Destinasi +{" "}
                  {guideSource === "DESTINATION"
                    ? "Tarif Pemandu Lokal + "
                    : ""}
                  Margin Travel Organizer
                </strong>
                . Biaya layanan traveler tetap terpisah saat checkout.
              </p>
            </div>
          </div>

          <div className="eo-form-group">
            <label htmlFor="eo-margin-input" className="eo-form-label">
              Margin Travel Organizer (Rp / Orang) *
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

          <div className="eo-pricing-reference">
            <button
              type="button"
              className="eo-pricing-reference__toggle"
              aria-expanded={showPricingReference}
              aria-controls="eo-pricing-reference-panel"
              onClick={() => setShowPricingReference((current) => !current)}
            >
              <span>
                <strong>Referensi Harga dari Sinyal Traveler</strong>
                <span>
                  Lihat distribusi budget dari data simulasi prototype sebagai
                  bahan pertimbangan.
                </span>
              </span>
              <span aria-hidden="true">{showPricingReference ? "−" : "+"}</span>
            </button>

            {showPricingReference && (
              <div
                id="eo-pricing-reference-panel"
                className="eo-pricing-reference__panel"
              >
                <div className="eo-pricing-reference__meta">
                  <Badge tone="info">Data simulasi prototype</Badge>
                  <span>
                    {pricingReferenceTotalResponses.toLocaleString("id-ID")}{" "}
                    respons simulasi
                  </span>
                </div>

                {selectedInsight ? (
                  <div className="eo-pricing-reference__insight">
                    <span>Rentang budget pada insight terpilih</span>
                    <strong>{selectedInsight.preferredBudgetRange}</strong>
                    <small>{selectedInsight.title}</small>
                  </div>
                ) : (
                  <p className="eo-pricing-reference__context">
                    Belum ada insight khusus yang dipilih. Distribusi berikut
                    menggunakan seluruh respons simulasi prototype.
                  </p>
                )}

                {topPricingBudget && (
                  <div className="eo-pricing-reference__headline">
                    <span>Rentang budget paling banyak dipilih</span>
                    <strong>{topPricingBudget.label}</strong>
                    <span>
                      {topPricingBudget.percentage}% respons simulasi (
                      {topPricingBudget.count.toLocaleString("id-ID")} respons)
                    </span>
                  </div>
                )}

                <div
                  className="eo-pricing-reference__distribution"
                  aria-label="Distribusi budget respons simulasi"
                >
                  {pricingBudgetDistribution.map((budget) => (
                    <div key={budget.id} className="eo-pricing-reference__row">
                      <div className="eo-pricing-reference__row-copy">
                        <span>{budget.label}</span>
                        <strong>{budget.percentage}%</strong>
                      </div>
                      <div
                        className="eo-pricing-reference__track"
                        aria-hidden="true"
                      >
                        <span
                          className="eo-pricing-reference__fill"
                          style={{ width: `${budget.percentage}%` }}
                        />
                      </div>
                      <small>
                        {budget.count.toLocaleString("id-ID")} respons simulasi
                      </small>
                    </div>
                  ))}
                </div>

                <p className="eo-pricing-reference__disclaimer">
                  Referensi ini bersifat opsional dan tidak mengubah Margin
                  Travel Organizer secara otomatis. Gunakan sebagai sinyal arah
                  pricing, bukan sebagai harga terbaik atau jaminan konversi.
                </p>
              </div>
            )}
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

            {selectedDestination?.baseCostIncludes &&
              selectedDestination.baseCostIncludes.length > 0 && (
                <div
                  style={{
                    fontSize: "var(--font-size-caption)",
                    color: "var(--color-text-secondary)",
                    padding: "var(--space-2) var(--space-3)",
                    background: "var(--color-bg-surface-subtle)",
                    borderRadius: "var(--radius-sm)",
                    margin: "var(--space-1) 0 var(--space-2)",
                    lineHeight: 1.4,
                  }}
                >
                  <strong>Cakupan biaya dasar destinasi:</strong>{" "}
                  {selectedDestination.baseCostIncludes.join(", ")}
                </div>
              )}

            <div className="eo-pricing-row">
              <span>Pemandu destinasi:</span>
              <strong>
                {guideSource === "DESTINATION"
                  ? `Rp${localGuideFee.toLocaleString("id-ID")}`
                  : "Tidak digunakan"}
              </strong>
            </div>

            <div className="eo-pricing-row">
              <span>Margin Travel Organizer:</span>
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
                    : "Pemandu Travel Organizer"}
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

              {imageUrl && (
                <div className="eo-builder-review-thumb">
                  <img src={imageUrl} alt={`Foto utama ${title || "paket"}`} />
                </div>
              )}
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

            {/* Travel Logistics Preview */}
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
                Pengaturan Perjalanan & Titik Kumpul:
              </strong>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-2)",
                  fontSize: "var(--font-size-body-sm)",
                }}
              >
                <div>
                  <span style={{ color: "var(--color-text-muted)" }}>
                    Titik Kumpul:{" "}
                  </span>
                  <strong>{meetingPointLabel || "-"}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--color-text-muted)" }}>
                    Waktu Kumpul:{" "}
                  </span>
                  <strong>{departureTimeLabel || "-"}</strong>
                </div>
                {outboundTransport && (
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>
                      Transportasi Menuju:{" "}
                    </span>
                    <span>{outboundTransport}</span>
                  </div>
                )}
                {returnTransport && (
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>
                      Transportasi Kembali:{" "}
                    </span>
                    <span>{returnTransport}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cakupan Paket Preview */}
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
                Cakupan Fasilitas Paket:
              </strong>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-3)",
                  fontSize: "var(--font-size-body-sm)",
                }}
              >
                <div>
                  <strong style={{ color: "var(--color-success-text)" }}>
                    Sudah Termasuk:
                  </strong>
                  <ul
                    style={{
                      margin: "var(--space-1) 0 0",
                      paddingLeft: "1.2rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {includedItemsText
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                  </ul>
                </div>
                <div>
                  <strong style={{ color: "var(--color-text-muted)" }}>
                    Belum Termasuk:
                  </strong>
                  <ul
                    style={{
                      margin: "var(--space-1) 0 0",
                      paddingLeft: "1.2rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {excludedItemsText
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                  </ul>
                </div>
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
                <span>
                  Pemandu lokal:{" "}
                  {guideSource === "DESTINATION"
                    ? `Rp${localGuideFee.toLocaleString("id-ID")}`
                    : "Tidak digunakan"}
                </span>{" "}
                •{" "}
                <span>
                  Margin Travel Organizer: Rp{eoMargin.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "var(--space-4)",
              flexWrap: "wrap",
              gap: "var(--space-2)",
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

            <div
              style={{
                display: "flex",
                gap: "var(--space-2)",
                flexWrap: "wrap",
              }}
            >
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setShowTravelerPreview(true)}
              >
                Preview sebagai Traveler
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
          </div>
        </section>
      )}

      {/* Traveler-Facing Draft Preview Dialog (Step 5) */}
      {showTravelerPreview && (
        <Dialog
          open={showTravelerPreview}
          title="Preview sebagai Traveler"
          description="Tampilan perkiraan draf paket dari sudut pandang traveler sebelum diajukan ke review kurasi Admin."
          onClose={() => setShowTravelerPreview(false)}
          actions={
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setShowTravelerPreview(false)}
            >
              Tutup Preview
            </Button>
          }
        >
          <div className="eo-builder-traveler-preview">
            <div className="eo-builder-traveler-preview__draft-notice">
              <span className="eo-builder-traveler-preview__draft-tag">
                Preview Draf
              </span>
              <span className="eo-builder-traveler-preview__draft-desc">
                Tampilan perkiraan pengalaman sebelum diajukan ke review kurasi
                Admin.
              </span>
            </div>

            {imageUrl ? (
              <div className="eo-builder-traveler-preview__hero">
                <img
                  src={imageUrl}
                  alt={`Visual utama ${title || "paket"}`}
                  className="eo-builder-traveler-preview__img"
                />
              </div>
            ) : (
              <div className="eo-builder-traveler-preview__img-placeholder">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span>Visual utama belum ditambahkan.</span>
              </div>
            )}

            <div className="eo-builder-traveler-preview__header">
              <div className="eo-builder-traveler-preview__meta">
                {selectedDestination && (
                  <span>
                    {selectedDestination.name}
                    {selectedDestination.locationLabel
                      ? ` • ${selectedDestination.locationLabel}`
                      : ""}
                  </span>
                )}
                {selectedDestination && durationLabel && <span>•</span>}
                {durationLabel && <span>{durationLabel}</span>}
              </div>

              <h3 className="eo-builder-traveler-preview__title">
                {title || "Draf Tanpa Judul"}
              </h3>

              <p className="eo-builder-traveler-preview__summary">
                {shortSummary || "Belum ada ringkasan pengalaman."}
              </p>
            </div>

            <div className="eo-builder-traveler-preview__price-box">
              <span className="eo-builder-traveler-preview__price-label">
                Mulai dari
              </span>
              <strong className="eo-builder-traveler-preview__price-amount">
                Rp{customerPrice.toLocaleString("id-ID")}
              </strong>
              <span className="eo-builder-traveler-preview__price-unit">
                / orang
              </span>
            </div>

            {itinerary.length > 0 && (
              <div className="eo-builder-traveler-preview__section">
                <h4 className="eo-builder-traveler-preview__section-title">
                  Rencana Pengalaman
                </h4>
                <div className="eo-builder-traveler-preview__timeline">
                  {itinerary.map((item) => (
                    <div
                      key={item.order}
                      className="eo-builder-traveler-preview__timeline-item"
                    >
                      <div className="eo-builder-traveler-preview__timeline-header">
                        <span className="eo-builder-traveler-preview__timeline-title">
                          #{item.order} {item.title || "Aktivitas"}
                        </span>
                        {item.durationLabel && (
                          <span className="eo-builder-traveler-preview__timeline-duration">
                            {item.durationLabel}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="eo-builder-traveler-preview__timeline-desc">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Travel Logistics in Preview */}
            <div className="eo-builder-traveler-preview__section">
              <h4 className="eo-builder-traveler-preview__section-title">
                Pengaturan Perjalanan
              </h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                  fontSize: "var(--font-size-body-sm)",
                  color: "var(--color-text-secondary)",
                }}
              >
                <div>
                  <strong>Titik Kumpul:</strong> {meetingPointLabel}
                </div>
                <div>
                  <strong>Waktu Keberangkatan:</strong> {departureTimeLabel}
                </div>
                {outboundTransport && (
                  <div>
                    <strong>Transportasi Menuju:</strong> {outboundTransport}
                  </div>
                )}
                {returnTransport && (
                  <div>
                    <strong>Transportasi Kembali:</strong> {returnTransport}
                  </div>
                )}
              </div>
            </div>

            {/* Cakupan Paket in Preview */}
            <div className="eo-builder-traveler-preview__section">
              <h4 className="eo-builder-traveler-preview__section-title">
                Fasilitas & Ketentuan
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-3)",
                  fontSize: "var(--font-size-caption)",
                }}
              >
                <div>
                  <strong style={{ color: "var(--color-success-text)" }}>
                    Sudah Termasuk:
                  </strong>
                  <ul
                    style={{
                      margin: "var(--space-1) 0 0",
                      paddingLeft: "1.2rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {includedItemsText
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                  </ul>
                </div>
                <div>
                  <strong style={{ color: "var(--color-text-muted)" }}>
                    Belum Termasuk:
                  </strong>
                  <ul
                    style={{
                      margin: "var(--space-1) 0 0",
                      paddingLeft: "1.2rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {excludedItemsText
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>

            {safetyNotes
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean).length > 0 && (
              <div className="eo-builder-traveler-preview__section">
                <h4 className="eo-builder-traveler-preview__section-title">
                  Persiapan & Keselamatan
                </h4>
                <ul className="eo-builder-traveler-preview__list">
                  {safetyNotes
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                </ul>
              </div>
            )}

            <p className="eo-builder-traveler-preview__footer-note">
              Preview ini menampilkan draf sebelum review Admin dan belum
              berarti package telah disetujui atau LIVE.
            </p>
          </div>
        </Dialog>
      )}
    </div>
  );
}
