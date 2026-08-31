import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { Button, Skeleton } from "../../components/ui";
import {
  EXPLORE_BUDGET_OPTIONS,
  EXPLORE_DEPARTURE_OPTIONS,
  EXPLORE_DURATION_OPTIONS,
  EXPLORE_MOOD_OPTIONS,
  EXPLORE_SORT_OPTIONS,
} from "./config";
import {
  parseExploreSearchParams,
  serializeExploreSearchParams,
} from "./engine";
import { ExplorePackageCard } from "./ExplorePackageCard";
import { FilterSheet } from "./FilterSheet";
import { defaultExploreAdapter } from "./mockAdapter";
import type {
  ExploreAdapter,
  ExploreFilters,
  ExploreResult,
  ExploreSortOption,
} from "./types";
import "./explore.css";

export interface ExploreScreenProps {
  adapter?: ExploreAdapter;
}

export function ExploreScreen({
  adapter = defaultExploreAdapter,
}: ExploreScreenProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [result, setResult] = useState<ExploreResult | null>(null);

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Parse filters from URL
  const currentFilters = parseExploreSearchParams(searchParams);

  // Search input state
  const [searchInput, setSearchInput] = useState(currentFilters.query ?? "");
  const [prevQuery, setPrevQuery] = useState(currentFilters.query);

  if (currentFilters.query !== prevQuery) {
    setPrevQuery(currentFilters.query);
    setSearchInput(currentFilters.query ?? "");
  }

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(undefined);
    try {
      const res = await adapter.getExplorePackages(currentFilters);
      setResult(res);
      setIsLoading(false);
    } catch (err: unknown) {
      setIsLoading(false);
      setErrorMessage(
        err instanceof Error ? err.message : "Experience belum bisa dimuat.",
      );
    }
  };

  useEffect(() => {
    let isMounted = true;

    adapter
      .getExplorePackages(currentFilters)
      .then((res) => {
        if (!isMounted) return;
        setResult(res);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setIsLoading(false);
        setErrorMessage(
          err instanceof Error ? err.message : "Experience belum bisa dimuat.",
        );
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, adapter]);

  const updateFilters = (newFilters: Partial<ExploreFilters>) => {
    const merged: ExploreFilters = {
      ...currentFilters,
      ...newFilters,
    };

    // Clean undefined or empty strings
    (Object.keys(merged) as (keyof ExploreFilters)[]).forEach((key) => {
      if (merged[key] === undefined || merged[key] === "") {
        delete merged[key];
      }
    });

    const nextParams = serializeExploreSearchParams(merged);
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateFilters({ query: searchInput.trim() || undefined });
  };

  const handleSortChange = (newSort: ExploreSortOption) => {
    updateFilters({ sort: newSort });
  };

  const handleResetAllFilters = () => {
    setSearchInput("");
    setSearchParams(new URLSearchParams());
  };

  const activeFilterCount = [
    currentFilters.budget,
    currentFilters.duration,
    currentFilters.departure,
    currentFilters.destination,
  ].filter(Boolean).length;

  const hasAnyActiveFilters =
    Boolean(currentFilters.query) ||
    Boolean(currentFilters.mood) ||
    activeFilterCount > 0;

  // Human-facing labels for active chips
  const activeMoodLabel = currentFilters.mood
    ? EXPLORE_MOOD_OPTIONS.find((m) => m.value === currentFilters.mood)?.label
    : undefined;

  const activeBudgetLabel = currentFilters.budget
    ? EXPLORE_BUDGET_OPTIONS.find((b) => b.value === currentFilters.budget)
        ?.label
    : undefined;

  const activeDurationLabel = currentFilters.duration
    ? EXPLORE_DURATION_OPTIONS.find((d) => d.value === currentFilters.duration)
        ?.label
    : undefined;

  const activeDepartureLabel = currentFilters.departure
    ? EXPLORE_DEPARTURE_OPTIONS.find(
        (dep) => dep.value === currentFilters.departure,
      )?.label
    : undefined;

  return (
    <div className="explore-container">
      {/* Page Header */}
      <header className="explore-header">
        <h1 className="explore-header__title">Jelajahi Experience</h1>
        <p className="explore-header__subtitle">
          Temukan wellness experience terkurasi dari destinasi lokal
          terverifikasi.
        </p>
      </header>

      {/* Controls row: Search + Filter & Sort Toolbar */}
      <section
        className="explore-controls-section"
        aria-label="Kontrol pencarian dan filter"
      >
        <form
          className="explore-search-form"
          onSubmit={handleSearchSubmit}
          role="search"
        >
          <div className="explore-search-input-wrap">
            <span className="explore-search-icon" aria-hidden="true">
              🔍
            </span>
            <input
              type="search"
              className="explore-search-input"
              placeholder="Cari aktivitas, lokasi, atau destinasi..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Cari aktivitas, lokasi, atau destinasi"
            />
          </div>
          <button type="submit" className="explore-search-submit">
            Cari
          </button>
        </form>

        <div className="explore-toolbar">
          <button
            type="button"
            className={`explore-filter-btn ${activeFilterCount > 0 ? "explore-filter-btn--active" : ""}`}
            onClick={() => setIsFilterSheetOpen(true)}
            aria-label="Buka filter"
          >
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="explore-filter-count-badge">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="explore-sort-wrap">
            <label htmlFor="explore-sort-select" className="explore-sort-label">
              Urutkan:
            </label>
            <select
              id="explore-sort-select"
              className="explore-sort-select"
              value={currentFilters.sort ?? "popular"}
              onChange={(e) =>
                handleSortChange(e.target.value as ExploreSortOption)
              }
            >
              {EXPLORE_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Active Filter Chips */}
      {hasAnyActiveFilters && (
        <section className="explore-active-chips-bar" aria-label="Filter aktif">
          {currentFilters.query && (
            <span className="explore-active-chip">
              Kata kunci: "{currentFilters.query}"
              <button
                type="button"
                className="explore-active-chip__remove"
                onClick={() => {
                  setSearchInput("");
                  updateFilters({ query: undefined });
                }}
                aria-label="Hapus kata kunci"
              >
                ✕
              </button>
            </span>
          )}

          {activeMoodLabel && (
            <span className="explore-active-chip">
              Suasana: {activeMoodLabel}
              <button
                type="button"
                className="explore-active-chip__remove"
                onClick={() => updateFilters({ mood: undefined })}
                aria-label="Hapus filter suasana"
              >
                ✕
              </button>
            </span>
          )}

          {activeBudgetLabel && (
            <span className="explore-active-chip">
              Budget: {activeBudgetLabel}
              <button
                type="button"
                className="explore-active-chip__remove"
                onClick={() => updateFilters({ budget: undefined })}
                aria-label="Hapus filter budget"
              >
                ✕
              </button>
            </span>
          )}

          {activeDurationLabel && (
            <span className="explore-active-chip">
              Durasi: {activeDurationLabel}
              <button
                type="button"
                className="explore-active-chip__remove"
                onClick={() => updateFilters({ duration: undefined })}
                aria-label="Hapus filter durasi"
              >
                ✕
              </button>
            </span>
          )}

          {activeDepartureLabel && (
            <span className="explore-active-chip">
              Dari: {activeDepartureLabel}
              <button
                type="button"
                className="explore-active-chip__remove"
                onClick={() => updateFilters({ departure: undefined })}
                aria-label="Hapus filter area keberangkatan"
              >
                ✕
              </button>
            </span>
          )}

          {currentFilters.destination &&
            result?.availableDestinations.some(
              (d) =>
                d.toLowerCase() === currentFilters.destination?.toLowerCase(),
            ) && (
              <span className="explore-active-chip">
                Destinasi: {currentFilters.destination}
                <button
                  type="button"
                  className="explore-active-chip__remove"
                  onClick={() => updateFilters({ destination: undefined })}
                  aria-label="Hapus filter destinasi"
                >
                  ✕
                </button>
              </span>
            )}

          <button
            type="button"
            className="explore-reset-link"
            onClick={handleResetAllFilters}
          >
            Reset semua
          </button>
        </section>
      )}

      {/* Loading state with skeleton cards */}
      {isLoading ? (
        <div className="explore-packages-grid" aria-busy="true">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="explore-package-card">
              <Skeleton height="10rem" />
              <div className="explore-package-card__body">
                <Skeleton width="40%" height="1.25rem" />
                <Skeleton width="75%" height="1.5rem" />
                <Skeleton width="100%" height="2.5rem" />
              </div>
            </div>
          ))}
        </div>
      ) : errorMessage ? (
        /* Error state */
        <div className="explore-error-box" role="alert">
          <h2>Experience belum bisa dimuat.</h2>
          <p>
            Filter dan pencarianmu tetap tersimpan. Coba lagi beberapa saat.
          </p>
          <Button variant="primary" size="md" onClick={loadData}>
            Coba lagi
          </Button>
        </div>
      ) : result && result.packages.length > 0 ? (
        /* Results list */
        <section
          className="explore-results-section"
          aria-labelledby="results-count-heading"
        >
          <header className="explore-results-header">
            <h2 id="results-count-heading" className="explore-results-count">
              {result.totalCount} experience ditemukan
            </h2>
          </header>
          <div className="explore-packages-grid">
            {result.packages.map((pkg) => (
              <ExplorePackageCard key={pkg.id} packageData={pkg} />
            ))}
          </div>
        </section>
      ) : (
        /* Empty state */
        <div className="explore-empty-box">
          <h2>
            Belum ada experience yang cocok dengan pencarian atau filter ini.
          </h2>
          <p>
            Coba ubah kata kunci atau bersihkan filter untuk melihat pilihan
            experience lainnya.
          </p>
          <Button variant="secondary" size="md" onClick={handleResetAllFilters}>
            Reset filter
          </Button>
        </div>
      )}

      {/* Mobile Filter Sheet */}
      <FilterSheet
        open={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        currentFilters={currentFilters}
        availableDestinations={result?.availableDestinations ?? []}
        onApply={(newFilters) => updateFilters(newFilters)}
        onReset={() =>
          updateFilters({
            budget: undefined,
            duration: undefined,
            departure: undefined,
            destination: undefined,
          })
        }
      />
    </div>
  );
}
