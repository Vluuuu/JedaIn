import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Badge, Button, Skeleton } from "../../components/ui";
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
        err instanceof Error
          ? err.message
          : "Rekomendasi belum bisa dimuat.",
      );
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [adapter]);

  if (isLoading) {
    return (
      <div className="recommendation-container" aria-busy="true">
        <div className="recommendation-layout">
          <div className="recommendation-header">
            <h1>Menyiapkan rekomendasi untukmu...</h1>
            <p>Mencocokkan pilihan jedamu dengan kurasi paket yang tersedia.</p>
          </div>
          <div className="recommendation-hero-card">
            <Skeleton height="14rem" />
            <div className="recommendation-hero-content">
              <Skeleton width="40%" height="1.5rem" />
              <Skeleton width="80%" height="2rem" />
              <Skeleton width="100%" height="3rem" />
              <Skeleton width="100%" height="3rem" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage || !result) {
    return (
      <div className="recommendation-container">
        <div className="recommendation-error-box" role="alert">
          <h1>Rekomendasi belum bisa dimuat.</h1>
          <p>
            Jawaban kuismu tetap tersimpan. Coba lagi untuk melihat pilihanmu.
          </p>
          <Button variant="primary" size="md" onClick={fetchRecommendations}>
            Coba lagi
          </Button>
        </div>
      </div>
    );
  }

  const { state, topRecommendation, alternatives } = result;
  const isFallback = state === "FALLBACK";
  const topPkg = topRecommendation.package;
  const durationLabel =
    QUIZ_DURATION_OPTIONS.find((d) => d.value === topPkg.durationType)?.label ??
    topPkg.durationType;

  const formattedPrice = `Rp${topPkg.pricePerPerson.toLocaleString("id-ID")}`;

  return (
    <div className="recommendation-container">
      <div className="recommendation-layout">
        <header className="recommendation-header">
          {isFallback ? (
            <>
              <h1>
                Belum ada yang pas banget, tapi ini pilihan yang paling mendekati
                preferensimu.
              </h1>
              <p>
                Kamu tetap bisa melihat experience yang paling dekat dengan
                pilihanmu sekarang.
              </p>
            </>
          ) : (
            <>
              <h1>Ini jeda yang paling cocok buat kamu sekarang.</h1>
              <p>
                Berdasarkan pilihan terbarumu, ini experience yang paling
                relevan untuk dicoba lebih dulu.
              </p>
            </>
          )}
        </header>

        {/* HERO TOP RECOMMENDATION */}
        <section
          className="recommendation-hero-card"
          aria-labelledby="top-package-title"
        >
          <div className="recommendation-hero-visual">
            <div className="recommendation-hero-visual__overlay">
              <Badge tone={isFallback ? "neutral" : "success"}>
                {isFallback ? "Pilihan terdekat" : "Pilihan utama"}
              </Badge>
              <Badge tone="neutral">
                {topPkg.verificationLevel === "PLUS"
                  ? "Terverifikasi Plus"
                  : "Terverifikasi Dasar"}
              </Badge>
            </div>
          </div>

          <div className="recommendation-hero-content">
            <div className="recommendation-meta-row">
              <span>{topPkg.locationLabel}</span>
              <span>•</span>
              <span>{durationLabel}</span>
            </div>

            <h2 id="top-package-title" className="recommendation-title">
              {topPkg.title}
            </h2>

            <p className="recommendation-summary">{topPkg.shortSummary}</p>

            <div className="recommendation-price-box">
              <span className="recommendation-price-amount">
                {formattedPrice}
              </span>
              <span className="recommendation-price-unit">/ orang</span>
            </div>

            {topRecommendation.reasons.length > 0 && (
              <div
                className="recommendation-why-box"
                aria-label="Kenapa ini cocok"
              >
                <span className="recommendation-why-title">Kenapa ini cocok?</span>
                <div className="recommendation-chips">
                  {topRecommendation.reasons.map((reason, idx) => (
                    <span key={idx} className="recommendation-chip">
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="button"
              variant="primary"
              size="lg"
              className="recommendation-cta-btn"
              onClick={() => navigate(`/packages/${topPkg.id}`)}
            >
              Lihat Experience
            </Button>
          </div>
        </section>

        {/* ALTERNATIVES */}
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
                const altDuration =
                  QUIZ_DURATION_OPTIONS.find(
                    (d) => d.value === altPkg.durationType,
                  )?.label ?? altPkg.durationType;

                return (
                  <Link
                    key={altPkg.id}
                    to={`/packages/${altPkg.id}`}
                    className="recommendation-alt-card"
                  >
                    <div className="recommendation-alt-content">
                      <div className="recommendation-alt-meta">
                        <span>{altPkg.locationLabel}</span> •{" "}
                        <span>{altDuration}</span>
                      </div>
                      <span className="recommendation-alt-title">
                        {altPkg.title}
                      </span>
                    </div>

                    <div className="recommendation-alt-footer">
                      <span className="recommendation-price-amount">
                        Rp{altPkg.pricePerPerson.toLocaleString("id-ID")}
                      </span>
                      <Badge tone="neutral">Lihat</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* SECONDARY ACTION */}
        <div className="recommendation-bottom-actions">
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="recommendation-home-btn"
            onClick={() => navigate("/home")}
          >
            Lanjut ke Home &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
}
