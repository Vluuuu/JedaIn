import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui";
import {
  EXPLORE_BUDGET_OPTIONS,
  EXPLORE_DEPARTURE_OPTIONS,
  EXPLORE_DURATION_OPTIONS,
} from "./config";
import type {
  ExploreBudgetBucket,
  ExploreDepartureKey,
  ExploreDurationKey,
  ExploreFilters,
} from "./types";

export interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  currentFilters: ExploreFilters;
  availableDestinations: string[];
  onApply: (newFilters: Partial<ExploreFilters>) => void;
  onReset: () => void;
}

export function FilterSheet(props: FilterSheetProps) {
  if (!props.open) return null;
  return <FilterSheetContent {...props} />;
}

function FilterSheetContent({
  onClose,
  currentFilters,
  availableDestinations,
  onApply,
}: FilterSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Local draft states initialized once per sheet open
  const [draftBudget, setDraftBudget] = useState<
    ExploreBudgetBucket | undefined
  >(currentFilters.budget);
  const [draftDuration, setDraftDuration] = useState<
    ExploreDurationKey | undefined
  >(currentFilters.duration);
  const [draftDeparture, setDraftDeparture] = useState<
    ExploreDepartureKey | undefined
  >(currentFilters.departure);
  const [draftDestination, setDraftDestination] = useState<string | undefined>(
    currentFilters.destination,
  );

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      dialog.focus();
    }

    return () => {
      if (dialog && dialog.open) {
        dialog.close();
      }
      previouslyFocusedRef.current?.focus();
    };
  }, []);

  const handleApply = () => {
    onApply({
      budget: draftBudget,
      duration: draftDuration,
      departure: draftDeparture,
      destination: draftDestination,
    });
    onClose();
  };

  const handleClearDraft = () => {
    // Reset clears DRAFT filter values only; sheet stays open and URL/applied filters remain unchanged
    setDraftBudget(undefined);
    setDraftDuration(undefined);
    setDraftDeparture(undefined);
    setDraftDestination(undefined);
  };

  return (
    <dialog
      ref={dialogRef}
      className="explore-sheet-dialog"
      aria-labelledby="filter-sheet-title"
      tabIndex={-1}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className="explore-sheet-container">
        <header className="explore-sheet-header">
          <h2 id="filter-sheet-title" className="explore-sheet-title">
            Filter Experience
          </h2>
          <button
            type="button"
            className="explore-sheet-close-btn"
            onClick={onClose}
            aria-label="Tutup filter"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="explore-sheet-body">
          {/* 1. Budget Filter */}
          <section
            className="explore-filter-group"
            aria-labelledby="filter-group-budget"
          >
            <h3
              id="filter-group-budget"
              className="explore-filter-group__title"
            >
              Budget per Orang
            </h3>
            <div className="explore-filter-chips">
              {EXPLORE_BUDGET_OPTIONS.map((opt) => {
                const isSelected = draftBudget === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`explore-filter-chip ${isSelected ? "explore-filter-chip--active" : ""}`}
                    onClick={() =>
                      setDraftBudget(isSelected ? undefined : opt.value)
                    }
                    aria-pressed={isSelected}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Duration Filter */}
          <section
            className="explore-filter-group"
            aria-labelledby="filter-group-duration"
          >
            <h3
              id="filter-group-duration"
              className="explore-filter-group__title"
            >
              Durasi
            </h3>
            <div className="explore-filter-chips">
              {EXPLORE_DURATION_OPTIONS.map((opt) => {
                const isSelected = draftDuration === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`explore-filter-chip ${isSelected ? "explore-filter-chip--active" : ""}`}
                    onClick={() =>
                      setDraftDuration(isSelected ? undefined : opt.value)
                    }
                    aria-pressed={isSelected}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. Departure Area */}
          <section
            className="explore-filter-group"
            aria-labelledby="filter-group-departure"
          >
            <h3
              id="filter-group-departure"
              className="explore-filter-group__title"
            >
              Area Keberangkatan
            </h3>
            <div className="explore-filter-chips">
              {EXPLORE_DEPARTURE_OPTIONS.map((opt) => {
                const isSelected = draftDeparture === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`explore-filter-chip ${isSelected ? "explore-filter-chip--active" : ""}`}
                    onClick={() =>
                      setDraftDeparture(isSelected ? undefined : opt.value)
                    }
                    aria-pressed={isSelected}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 4. Destination Filter */}
          {availableDestinations.length > 0 && (
            <section
              className="explore-filter-group"
              aria-labelledby="filter-group-dest"
            >
              <h3
                id="filter-group-dest"
                className="explore-filter-group__title"
              >
                Destinasi
              </h3>
              <div className="explore-filter-chips">
                {availableDestinations.map((dest) => {
                  const isSelected =
                    draftDestination?.toLowerCase() === dest.toLowerCase();
                  return (
                    <button
                      key={dest}
                      type="button"
                      className={`explore-filter-chip ${isSelected ? "explore-filter-chip--active" : ""}`}
                      onClick={() =>
                        setDraftDestination(isSelected ? undefined : dest)
                      }
                      aria-pressed={isSelected}
                    >
                      {dest}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <footer className="explore-sheet-footer">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleClearDraft}
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleApply}
          >
            Terapkan Filter
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
