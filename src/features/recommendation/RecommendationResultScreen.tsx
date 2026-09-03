import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  LOGIN_ATMOSPHERE_VISUAL,
  getPackageVisual,
} from "../../lib/assets/packageImages";
import { QUIZ_DURATION_OPTIONS } from "../quiz/config";
import { defaultRecommendationAdapter } from "./mockAdapter";
import type { RecommendationAdapter, RecommendationResult } from "./types";
import "./recommendation.css";

export interface RecommendationResultScreenProps {
  adapter?: RecommendationAdapter;
}

export function RecommendationResultScreen({
  adapter = defaultRecommendationAdapter,
}: RecommendationResultScreenProps) {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [result, setResult] = useState<RecommendationResult | null>(null);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      const res = await adapter.getRecommendations();
      setResult(res);
      setIsLoading(false);
    } catch (err: unknown) {
      setIsLoading(false);
      setErrorMessage(
        err instanceof Error ? err.message : "Rekomendasi belum bisa dimuat.",
      );
    }
  };

  useEffect(() => {
    let isMounted = true;

    adapter
      .getRecommendations()
      .then((res) => {
        if (!isMounted) return;
        setResult(res);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setIsLoading(false);
        setErrorMessage(
          err instanceof Error ? err.message : "Rekomendasi belum bisa dimuat.",
        );
      });

    return () => {
      isMounted = false;
    };
  }, [adapter]);

  if (isLoading) {
    return (
      <div className="recommendation-screen" aria-busy="true">
        {/* Full-Screen Immersive Nature Backdrop */}
        <div className="recommendation-screen__backdrop" aria-hidden="true">
          <img
            src={LOGIN_ATMOSPHERE_VISUAL.svgDataUri}
            alt=""
            className="recommendation-screen__backdrop-image"
            loading="eager"
            width="1000"
            height="800"
          />
          <div className="recommendation-screen__backdrop-scrim" />
          <div className="recommendation-screen__backdrop-grain" />
        </div>

        <div className="recommendation-screen__container">
          <header className="recommendation-header">
            <h1 className="recommendation-header__title">
              Menyiapkan rekomendasi untukmu...
            </h1>
            <p className="recommendation-header__subtitle">
              Mencocokkan pilihan jedamu dengan kurasi paket yang tersedia.
            </p>
          </header>

          <div className="recommendation-hero-card recommendation-hero-card--skeleton">
            <div className="recommendation-skeleton-visual" />
            <div className="recommendation-hero-content">
              <div className="recommendation-skeleton-badge" />
              <div className="recommendation-skeleton-title" />
              <div className="recommendation-skeleton-text" />
              <div className="recommendation-skeleton-box" />
              <div className="recommendation-skeleton-btn" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage || !result || !result.topRecommendation) {
    return (
      <div className="recommendation-screen">
        {/* Full-Screen Immersive Nature Backdrop */}
        <div className="recommendation-screen__backdrop" aria-hidden="true">
          <img
            src={LOGIN_ATMOSPHERE_VISUAL.svgDataUri}
            alt=""
            className="recommendation-screen__backdrop-image"
            loading="eager"
            width="1000"
            height="800"
          />
          <div className="recommendation-screen__backdrop-scrim" />
          <div className="recommendation-screen__backdrop-grain" />
        </div>

        <div className="recommendation-screen__container">
          <main className="recommendation-error-card" role="alert">
            <div className="recommendation-error-card__icon" aria-hidden="true">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="recommendation-error-card__title">
              Rekomendasi belum bisa dimuat.
            </h1>
            <p className="recommendation-error-card__desc">
              Jawaban kuismu tetap tersimpan. Coba lagi untuk melihat pilihanmu.
            </p>
            <button
              type="button"
              className="recommendation-primary-btn"
              onClick={fetchRecommendations}
            >
              <span>Coba lagi</span>
            </button>
          </main>
        </div>
      </div>
    );
  }

  const { state, topRecommendation, alternatives } = result;
  const isFallback = state === "FALLBACK";
  const topPkg = topRecommendation.package;
  const topVisual = getPackageVisual(topPkg.id, topPkg.destinationName);
  const durationLabel =
    QUIZ_DURATION_OPTIONS.find((d) => d.value === topPkg.durationType)?.label ??
    topPkg.durationType;

  const formattedPrice = `Rp${topPkg.pricePerPerson.toLocaleString("id-ID")}`;

  return (
    <div className="recommendation-screen">
      {/* Full-Screen Immersive Nature Backdrop */}
      <div className="recommendation-screen__backdrop" aria-hidden="true">
        <img
          src={LOGIN_ATMOSPHERE_VISUAL.svgDataUri}
          alt=""
          className="recommendation-screen__backdrop-image"
          loading="eager"
          width="1000"
          height="800"
        />
        <div className="recommendation-screen__backdrop-scrim" />
        <div className="recommendation-screen__backdrop-grain" />
      </div>

      <div className="recommendation-screen__container">
        {/* Editorial Heading */}
        <header className="recommendation-header">
          {isFallback ? (
            <>
              <h1 className="recommendation-header__title">
                Belum ada yang pas banget, tapi ini pilihan yang paling
                mendekati preferensimu.
              </h1>
              <p className="recommendation-header__subtitle">
                Kamu tetap bisa melihat experience yang paling dekat dengan
                pilihanmu sekarang.
              </p>
            </>
          ) : (
            <>
              <h1 className="recommendation-header__title">
                Ini jeda yang paling cocok buat kamu sekarang.
              </h1>
              <p className="recommendation-header__subtitle">
                Berdasarkan pilihan terbarumu, ini experience yang paling
                relevan untuk dicoba lebih dulu.
              </p>
            </>
          )}
        </header>

        {/* DOMINANT HERO TOP RECOMMENDATION CARD */}
        <main
          className="recommendation-hero-card"
          aria-labelledby="top-package-title"
        >
          <div
            className="recommendation-hero-visual"
            style={{ backgroundImage: `url("${topVisual.svgDataUri}")` }}
            role="img"
            aria-label={`Ilustrasi suasana ${topPkg.title}`}
          >
            <div className="recommendation-hero-visual__scrim" />
            <div className="recommendation-hero-visual__overlay">
              <span
                className={`recommendation-badge ${isFallback ? "recommendation-badge--fallback" : "recommendation-badge--matched"}`}
              >
                {isFallback ? "Pilihan terdekat" : "Pilihan utama"}
              </span>
              <span className="recommendation-badge recommendation-badge--neutral">
                {topPkg.verificationLevel === "PLUS"
                  ? "Terverifikasi Plus"
                  : "Terverifikasi Dasar"}
              </span>
            </div>
          </div>

          <div className="recommendation-hero-content">
            <div className="recommendation-meta-row">
              <span className="recommendation-meta-location">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {topPkg.locationLabel}
              </span>
              <span className="recommendation-meta-dot">•</span>
              <span className="recommendation-meta-duration">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {durationLabel}
              </span>
            </div>

            <h2 id="top-package-title" className="recommendation-title">
              {topPkg.title}
            </h2>

            <p className="recommendation-summary">{topPkg.shortSummary}</p>

            <div className="recommendation-price-box">
              <span className="recommendation-price-label">Mulai dari</span>
              <div className="recommendation-price-wrap">
                <span className="recommendation-price-amount">
                  {formattedPrice}
                </span>
                <span className="recommendation-price-unit">/ orang</span>
              </div>
            </div>

            {topRecommendation.reasons.length > 0 && (
              <div
                className="recommendation-why-box"
                aria-label={
                  isFallback ? "Kenapa ini mendekati" : "Kenapa ini cocok"
                }
              >
                <span className="recommendation-why-title">
                  {isFallback ? "Kenapa ini mendekati?" : "Kenapa ini cocok?"}
                </span>
                <div className="recommendation-reasons-list">
                  {topRecommendation.reasons.map((reason, idx) => (
                    <div key={idx} className="recommendation-reason-item">
                      <span
                        className="recommendation-reason-icon"
                        aria-hidden="true"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span className="recommendation-reason-text">
                        {reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              className="recommendation-primary-btn"
              onClick={() =>
                navigate(`/packages/${topPkg.id}`, {
                  state: {
                    personalizedContext: {
                      reasons: topRecommendation.reasons,
                      mode: isFallback ? "FALLBACK" : "MATCHED",
                    },
                  },
                })
              }
            >
              <span>Lihat Experience</span>
            </button>
          </div>
        </main>

        {/* ALTERNATIVES DISCOVERY */}
        {alternatives.length > 0 && (
          <section
            className="recommendation-alternatives-section"
            aria-labelledby="alt-section-heading"
          >
            <h3
              id="alt-section-heading"
              className="recommendation-alternatives-heading"
            >
              Pilihan lain yang juga dekat
            </h3>
            <div className="recommendation-alternatives-grid">
              {alternatives.map((item) => {
                const altPkg = item.package;
                const altVisual = getPackageVisual(
                  altPkg.id,
                  altPkg.destinationName,
                );
                const altDuration =
                  QUIZ_DURATION_OPTIONS.find(
                    (d) => d.value === altPkg.durationType,
                  )?.label ?? altPkg.durationType;

                return (
                  <Link
                    key={altPkg.id}
                    to={`/packages/${altPkg.id}`}
                    state={{
                      personalizedContext: {
                        reasons: item.reasons,
                        mode: isFallback ? "FALLBACK" : "MATCHED",
                      },
                    }}
                    className="recommendation-alt-card"
                  >
                    <div
                      className="recommendation-alt-thumb"
                      style={{
                        backgroundImage: `url("${altVisual.svgDataUri}")`,
                      }}
                      aria-hidden="true"
                    >
                      <div className="recommendation-alt-thumb__scrim" />
                      <span className="recommendation-alt-badge">
                        {altDuration}
                      </span>
                    </div>
                    <div className="recommendation-alt-body">
                      <div className="recommendation-alt-content">
                        <div className="recommendation-alt-meta">
                          <span>{altPkg.locationLabel}</span>
                        </div>
                        <h4 className="recommendation-alt-title">
                          {altPkg.title}
                        </h4>
                      </div>

                      <div className="recommendation-alt-footer">
                        <div className="recommendation-alt-price">
                          <span className="recommendation-alt-price-amount">
                            Rp{altPkg.pricePerPerson.toLocaleString("id-ID")}
                          </span>
                          <span className="recommendation-alt-price-unit">
                            /org
                          </span>
                        </div>
                        <span className="recommendation-alt-action">
                          Lihat &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* SECONDARY PROMPT: LANJUT KE HOME */}
        <footer className="recommendation-bottom-actions">
          <button
            type="button"
            className="recommendation-home-btn"
            onClick={() => navigate("/home")}
          >
            <span>Lanjut ke Home &rarr;</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
