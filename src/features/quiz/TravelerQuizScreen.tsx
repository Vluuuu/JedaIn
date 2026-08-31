import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button, TextField } from "../../components/ui";
import {
  QUIZ_ACTIVITY_OPTIONS,
  QUIZ_BUDGET_OPTIONS,
  QUIZ_DEPARTURE_OPTIONS,
  QUIZ_DURATION_OPTIONS,
  QUIZ_GROUP_SIZE_OPTIONS,
  QUIZ_GROUP_TYPE_OPTIONS,
  QUIZ_INTENT_OPTIONS,
  TOTAL_QUIZ_STEPS,
} from "./config";
import { ArrowLeftIcon, CheckCircleIcon } from "./icons";
import { defaultQuizAdapter } from "./mockAdapter";
import type {
  BudgetBand,
  CurrentIntent,
  DepartureAreaId,
  DurationPreference,
  GroupSizeBand,
  GroupType,
  PreferredActivity,
  QuizAdapter,
  QuizDraft,
} from "./types";
import "./quiz.css";

export interface TravelerQuizScreenProps {
  adapter?: QuizAdapter;
  onComplete?: (finalDraft: QuizDraft) => void;
}

export function TravelerQuizScreen({
  adapter = defaultQuizAdapter,
  onComplete,
}: TravelerQuizScreenProps) {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // Quiz state fields
  const [currentStep, setCurrentStep] = useState(1);
  const [currentIntent, setCurrentIntent] = useState<
    CurrentIntent | undefined
  >();
  const [preferredActivities, setPreferredActivities] = useState<
    PreferredActivity[]
  >([]);
  const [budgetBand, setBudgetBand] = useState<BudgetBand | undefined>();
  const [durationPreference, setDurationPreference] = useState<
    DurationPreference | undefined
  >();
  const [departureAreaId, setDepartureAreaId] = useState<
    DepartureAreaId | undefined
  >();
  const [departureAreaLabel, setDepartureAreaLabel] = useState<string>("");
  const [groupType, setGroupType] = useState<GroupType | undefined>();
  const [groupSizeBand, setGroupSizeBand] = useState<
    GroupSizeBand | undefined
  >();

  // Load existing draft for resume capability
  useEffect(() => {
    let isMounted = true;
    adapter
      .getQuizDraft()
      .then((draft) => {
        if (!isMounted) return;
        if (draft.current_intent) setCurrentIntent(draft.current_intent);
        if (draft.preferred_activities)
          setPreferredActivities(draft.preferred_activities);
        if (draft.budget_band) setBudgetBand(draft.budget_band);
        if (draft.duration_preference)
          setDurationPreference(draft.duration_preference);
        if (draft.departure_area_id)
          setDepartureAreaId(draft.departure_area_id);
        if (draft.departure_area_label)
          setDepartureAreaLabel(draft.departure_area_label);
        if (draft.group_type) setGroupType(draft.group_type);
        if (draft.group_size_band) setGroupSizeBand(draft.group_size_band);

        // Resume at latest incomplete step
        let resumeStep = draft.currentStep || 1;
        if (!draft.current_intent) resumeStep = 1;
        else if (
          !draft.preferred_activities ||
          draft.preferred_activities.length === 0
        )
          resumeStep = 2;
        else if (!draft.budget_band) resumeStep = 3;
        else if (!draft.duration_preference) resumeStep = 4;
        else if (!draft.departure_area_id) resumeStep = 5;
        else if (!draft.group_type || !draft.group_size_band) resumeStep = 6;

        setCurrentStep(resumeStep);
        setIsLoading(false);
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [adapter]);

  // Validation per step
  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 1:
        return Boolean(currentIntent);
      case 2:
        return (
          preferredActivities.length >= 1 && preferredActivities.length <= 2
        );
      case 3:
        return Boolean(budgetBand);
      case 4:
        return Boolean(durationPreference);
      case 5:
        if (!departureAreaId) return false;
        if (departureAreaId === "OTHER") {
          return Boolean(departureAreaLabel.trim());
        }
        return true;
      case 6:
        return Boolean(groupType && groupSizeBand);
      default:
        return false;
    }
  };

  const getSnapshotDraft = (step: number = currentStep): QuizDraft => ({
    currentStep: step,
    current_intent: currentIntent,
    preferred_activities: preferredActivities,
    budget_band: budgetBand,
    duration_preference: durationPreference,
    departure_area_id: departureAreaId,
    departure_area_label:
      departureAreaId === "OTHER"
        ? departureAreaLabel.trim()
        : departureAreaId
          ? departureAreaId === "MALANG"
            ? "Malang"
            : "Surabaya"
          : undefined,
    group_type: groupType,
    group_size_band: groupSizeBand,
  });

  const handleNext = async () => {
    if (!isStepValid() || isSubmitting) return;

    setErrorMessage(undefined);
    setIsSubmitting(true);

    try {
      const nextStep = currentStep + 1;
      const snapshot = getSnapshotDraft(
        nextStep <= TOTAL_QUIZ_STEPS ? nextStep : TOTAL_QUIZ_STEPS,
      );

      if (currentStep < TOTAL_QUIZ_STEPS) {
        await adapter.saveQuizStep(snapshot);
        setIsSubmitting(false);
        setCurrentStep(nextStep);
      } else {
        // Step 6 completion
        await adapter.completeQuiz(snapshot);
        setIsSubmitting(false);
        if (onComplete) {
          onComplete(snapshot);
        } else {
          navigate("/onboarding/result");
        }
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan jawaban. Silakan coba lagi.",
      );
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && !isSubmitting) {
      setErrorMessage(undefined);
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Activity multi-select toggle (max 2)
  const toggleActivity = (activity: PreferredActivity) => {
    if (errorMessage) setErrorMessage(undefined);
    if (preferredActivities.includes(activity)) {
      setPreferredActivities(preferredActivities.filter((a) => a !== activity));
    } else {
      if (preferredActivities.length < 2) {
        setPreferredActivities([...preferredActivities, activity]);
      }
    }
  };

  // Group selection handling (SOLO/PARTNER auto-sizes)
  const handleGroupTypeSelect = (type: GroupType) => {
    if (errorMessage) setErrorMessage(undefined);
    setGroupType(type);
    if (type === "SOLO") {
      setGroupSizeBand("ONE");
    } else if (type === "PARTNER") {
      setGroupSizeBand("TWO");
    } else {
      // Clear size so user chooses for FRIENDS / FAMILY
      if (groupSizeBand === "ONE" || groupSizeBand === "TWO") {
        setGroupSizeBand(undefined);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="quiz-container">
        <div className="quiz-layout">
          <div className="quiz-card">
            <p>Memuat kuis preferensi...</p>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = (currentStep / TOTAL_QUIZ_STEPS) * 100;

  return (
    <div className="quiz-container">
      <div className="quiz-layout">
        {/* Stepper Progress Header */}
        <header className="quiz-progress-header">
          <div className="quiz-progress-topbar">
            <button
              type="button"
              className="quiz-back-button"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              aria-label="Kembali ke pertanyaan sebelumnya"
            >
              <ArrowLeftIcon />
              <span>Kembali</span>
            </button>
            <span className="quiz-step-count" aria-live="polite">
              Langkah {currentStep} dari {TOTAL_QUIZ_STEPS}
            </span>
          </div>
          <div
            className="quiz-progress-track"
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={TOTAL_QUIZ_STEPS}
            aria-label="Progres pengisian kuis"
          >
            <div
              className="quiz-progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </header>

        <div className="quiz-card">
          {errorMessage && (
            <div className="quiz-error-banner" role="alert">
              <p>{errorMessage}</p>
            </div>
          )}

          {/* STEP 1: CURRENT INTENT */}
          {currentStep === 1 && (
            <section aria-labelledby="q1-title">
              <div className="quiz-question-header">
                <h1 id="q1-title">
                  Jeda seperti apa yang paling kamu butuhkan sekarang?
                </h1>
                <p>Pilih yang paling menggambarkan kebutuhanmu kali ini.</p>
              </div>

              <div
                className="quiz-options-grid quiz-options-grid--2col"
                role="radiogroup"
                aria-labelledby="q1-title"
              >
                {QUIZ_INTENT_OPTIONS.map((opt) => {
                  const isSelected = currentIntent === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`quiz-option-card ${isSelected ? "quiz-option-card--selected" : ""}`}
                      onClick={() => {
                        setCurrentIntent(opt.value);
                        if (errorMessage) setErrorMessage(undefined);
                      }}
                      disabled={isSubmitting}
                    >
                      <span
                        className="quiz-option-card__indicator"
                        aria-hidden="true"
                      >
                        <CheckCircleIcon />
                      </span>
                      <div className="quiz-option-card__content">
                        <strong className="quiz-option-card__title">
                          {opt.label}
                        </strong>
                        {opt.sublabel && (
                          <span className="quiz-option-card__desc">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* STEP 2: PREFERRED ACTIVITIES (MULTI-SELECT MAX 2) */}
          {currentStep === 2 && (
            <section aria-labelledby="q2-title">
              <div className="quiz-question-header">
                <h1 id="q2-title">
                  Aktivitas seperti apa yang paling ingin kamu lakukan?
                </h1>
                <p>Pilih maksimal 2 supaya rekomendasinya tetap fokus.</p>
                <div className="quiz-selection-feedback" aria-live="polite">
                  Terpilih: {preferredActivities.length} dari maksimal 2
                </div>
              </div>

              <div
                className="quiz-options-grid quiz-options-grid--2col"
                role="group"
                aria-labelledby="q2-title"
              >
                {QUIZ_ACTIVITY_OPTIONS.map((opt) => {
                  const isSelected = preferredActivities.includes(opt.value);
                  const isMaxReached =
                    preferredActivities.length >= 2 && !isSelected;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      className={`quiz-option-card quiz-option-card--multi ${isSelected ? "quiz-option-card--selected" : ""}`}
                      onClick={() => toggleActivity(opt.value)}
                      disabled={isSubmitting || (isMaxReached && !isSelected)}
                    >
                      <span
                        className="quiz-option-card__indicator"
                        aria-hidden="true"
                      >
                        <CheckCircleIcon />
                      </span>
                      <div className="quiz-option-card__content">
                        <strong className="quiz-option-card__title">
                          {opt.label}
                        </strong>
                        {opt.sublabel && (
                          <span className="quiz-option-card__desc">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* STEP 3: BUDGET COMFORT */}
          {currentStep === 3 && (
            <section aria-labelledby="q3-title">
              <div className="quiz-question-header">
                <h1 id="q3-title">
                  Untuk satu experience, budget yang nyaman per orang berapa?
                </h1>
                <p>Pilih kisaran yang paling realistis buat kamu kali ini.</p>
              </div>

              <div
                className="quiz-options-grid"
                role="radiogroup"
                aria-labelledby="q3-title"
              >
                {QUIZ_BUDGET_OPTIONS.map((opt) => {
                  const isSelected = budgetBand === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`quiz-option-card ${isSelected ? "quiz-option-card--selected" : ""}`}
                      onClick={() => {
                        setBudgetBand(opt.value);
                        if (errorMessage) setErrorMessage(undefined);
                      }}
                      disabled={isSubmitting}
                    >
                      <span
                        className="quiz-option-card__indicator"
                        aria-hidden="true"
                      >
                        <CheckCircleIcon />
                      </span>
                      <div className="quiz-option-card__content">
                        <strong className="quiz-option-card__title">
                          {opt.label}
                        </strong>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* STEP 4: DURATION PREFERENCE */}
          {currentStep === 4 && (
            <section aria-labelledby="q4-title">
              <div className="quiz-question-header">
                <h1 id="q4-title">
                  Berapa lama waktu yang realistis kamu punya untuk jeda kali
                  ini?
                </h1>
                <p>
                  Biar rekomendasinya cocok dengan waktu yang benar-benar kamu
                  punya.
                </p>
              </div>

              <div
                className="quiz-options-grid"
                role="radiogroup"
                aria-labelledby="q4-title"
              >
                {QUIZ_DURATION_OPTIONS.map((opt) => {
                  const isSelected = durationPreference === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`quiz-option-card ${isSelected ? "quiz-option-card--selected" : ""}`}
                      onClick={() => {
                        setDurationPreference(opt.value);
                        if (errorMessage) setErrorMessage(undefined);
                      }}
                      disabled={isSubmitting}
                    >
                      <span
                        className="quiz-option-card__indicator"
                        aria-hidden="true"
                      >
                        <CheckCircleIcon />
                      </span>
                      <div className="quiz-option-card__content">
                        <strong className="quiz-option-card__title">
                          {opt.label}
                        </strong>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* STEP 5: DEPARTURE AREA */}
          {currentStep === 5 && (
            <section aria-labelledby="q5-title">
              <div className="quiz-question-header">
                <h1 id="q5-title">
                  Kamu paling mungkin berangkat dari area mana?
                </h1>
                <p>
                  Ini membantu kami mencari experience yang lebih relevan dari
                  titik awalmu.
                </p>
              </div>

              <div
                className="quiz-options-grid"
                role="radiogroup"
                aria-labelledby="q5-title"
              >
                {QUIZ_DEPARTURE_OPTIONS.map((opt) => {
                  const isSelected = departureAreaId === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`quiz-option-card ${isSelected ? "quiz-option-card--selected" : ""}`}
                      onClick={() => {
                        setDepartureAreaId(opt.value);
                        if (errorMessage) setErrorMessage(undefined);
                      }}
                      disabled={isSubmitting}
                    >
                      <span
                        className="quiz-option-card__indicator"
                        aria-hidden="true"
                      >
                        <CheckCircleIcon />
                      </span>
                      <div className="quiz-option-card__content">
                        <strong className="quiz-option-card__title">
                          {opt.label}
                        </strong>
                      </div>
                    </button>
                  );
                })}
              </div>

              {departureAreaId === "OTHER" && (
                <div className="quiz-conditional-box">
                  <TextField
                    id="other-departure-area-input"
                    label="Tuliskan nama kota atau area keberangkatanmu"
                    placeholder="Contoh: Kediri, Batu, Blitar"
                    value={departureAreaLabel}
                    onChange={(e) => {
                      setDepartureAreaLabel(e.target.value);
                      if (errorMessage) setErrorMessage(undefined);
                    }}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </section>
          )}

          {/* STEP 6: GROUP CONTEXT */}
          {currentStep === 6 && (
            <section aria-labelledby="q6-title">
              <div className="quiz-question-header">
                <h1 id="q6-title">
                  Kamu rencananya menikmati jeda ini dengan siapa?
                </h1>
                <p>Pilih tipe kelompok perjalananmu.</p>
              </div>

              <div
                className="quiz-options-grid quiz-options-grid--2col"
                role="radiogroup"
                aria-labelledby="q6-title"
              >
                {QUIZ_GROUP_TYPE_OPTIONS.map((opt) => {
                  const isSelected = groupType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`quiz-option-card ${isSelected ? "quiz-option-card--selected" : ""}`}
                      onClick={() => handleGroupTypeSelect(opt.value)}
                      disabled={isSubmitting}
                    >
                      <span
                        className="quiz-option-card__indicator"
                        aria-hidden="true"
                      >
                        <CheckCircleIcon />
                      </span>
                      <div className="quiz-option-card__content">
                        <strong className="quiz-option-card__title">
                          {opt.label}
                        </strong>
                        {opt.sublabel && (
                          <span className="quiz-option-card__desc">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Conditional size selection for FRIENDS and FAMILY */}
              {(groupType === "FRIENDS" || groupType === "FAMILY") && (
                <div className="quiz-conditional-box">
                  <p className="quiz-conditional-box__title">
                    Berapa perkiraan jumlah peserta?
                  </p>
                  <div
                    className="quiz-options-grid"
                    role="radiogroup"
                    aria-label="Pilih jumlah peserta"
                  >
                    {QUIZ_GROUP_SIZE_OPTIONS.map((opt) => {
                      const isSelected = groupSizeBand === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          className={`quiz-option-card ${isSelected ? "quiz-option-card--selected" : ""}`}
                          onClick={() => {
                            setGroupSizeBand(opt.value);
                            if (errorMessage) setErrorMessage(undefined);
                          }}
                          disabled={isSubmitting}
                        >
                          <span
                            className="quiz-option-card__indicator"
                            aria-hidden="true"
                          >
                            <CheckCircleIcon />
                          </span>
                          <div className="quiz-option-card__content">
                            <strong className="quiz-option-card__title">
                              {opt.label}
                            </strong>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Action CTA */}
          <div className="quiz-actions">
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={!isStepValid() || isSubmitting}
              loading={isSubmitting}
              loadingLabel={
                currentStep === TOTAL_QUIZ_STEPS
                  ? "Menyiapkan rekomendasi..."
                  : "Menyimpan..."
              }
              onClick={handleNext}
              className="quiz-submit-button"
            >
              {currentStep === TOTAL_QUIZ_STEPS
                ? "Lihat Rekomendasiku"
                : "Lanjut"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
