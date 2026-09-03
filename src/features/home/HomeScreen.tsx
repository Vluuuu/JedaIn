import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Badge, Button, Skeleton } from "../../components/ui";
import { getPackageVisual } from "../../lib/assets/packageImages";
import {
  QUIZ_DEPARTURE_OPTIONS,
  QUIZ_DURATION_OPTIONS,
  QUIZ_INTENT_OPTIONS,
} from "../quiz/config";
import { DestinationCard } from "./DestinationCard";
import { defaultHomeAdapter } from "./mockAdapter";
import { MoodChip } from "./MoodChip";
import { PackageCard } from "./PackageCard";
import { PendingPaymentBanner } from "./PendingPaymentBanner";
import { SearchBar } from "./SearchBar";
import type { HomeAdapter, HomeViewModel } from "./types";
import { UpcomingTripCard } from "./UpcomingTripCard";
import "./home.css";

export interface HomeScreenProps {
  adapter?: HomeAdapter;
}

export function HomeScreen({ adapter = defaultHomeAdapter }: HomeScreenProps) {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<HomeViewModel | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await adapter.getHomeData();
      setData(res);
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    adapter
      .getHomeData()
      .then((res) => {
        if (!isMounted) return;
        setData(res);
        setIsLoading(false);
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [adapter]);

  if (isLoading || !data) {
    return (
      <div className="home-container" aria-busy="true">
        <div className="home-greeting-row">
          <Skeleton width="12rem" height="2rem" />
        </div>
        <div className="home-hero-card">
          <Skeleton height="14rem" />
          <div className="home-hero-card__body">
            <Skeleton width="40%" height="1.5rem" />
            <Skeleton width="80%" height="2rem" />
            <Skeleton width="100%" height="3rem" />
          </div>
        </div>
      </div>
    );
  }

  const {
    traveler,
    quizDraft,
    pendingPayment,
    upcomingTrip,
    personalizedRecommendation,
    popularPackages,
    departureAreaPackages,
    departureAreaName,
    verifiedDestinations,
    moodPresets,
    moduleErrors,
  } = data;

  const greetingName = traveler?.name?.trim().split(" ")[0];
  const greetingText = greetingName ? `Halo, ${greetingName}` : "Halo!";

  // Formatted human-readable preference summary
  const intentLabel = QUIZ_INTENT_OPTIONS.find(
    (o) => o.value === quizDraft?.current_intent,
  )?.label;

  const durationLabel = QUIZ_DURATION_OPTIONS.find(
    (o) => o.value === quizDraft?.duration_preference,
  )?.label;

  const departureLabel =
    quizDraft?.departure_area_id === "OTHER"
      ? quizDraft?.departure_area_label || "Area lain"
      : QUIZ_DEPARTURE_OPTIONS.find(
          (o) => o.value === quizDraft?.departure_area_id,
        )?.label;

  const recMode = personalizedRecommendation?.mode;
  const recItem = personalizedRecommendation?.item;
  const recPkg = recItem?.package;
  const recDuration = recPkg
    ? (QUIZ_DURATION_OPTIONS.find((d) => d.value === recPkg.durationType)
        ?.label ?? recPkg.durationType)
    : "";

  const recommendationHeading = recPkg
    ? recMode === "FALLBACK"
      ? "Pilihan terdekat untukmu"
      : "Pilihan untukmu"
    : "Rekomendasi Personal";

  // Derive departure contextual link for Explore
  const departureExploreHref =
    quizDraft?.departure_area_id === "MALANG"
      ? "/explore?departure=malang"
      : quizDraft?.departure_area_id === "SURABAYA"
        ? "/explore?departure=surabaya"
        : "/explore";

  return (
    <div className="home-container">
      {/* 1. Greeting / App Header context */}
      <header className="home-greeting-row">
        <div className="home-greeting-content">
          <div className="home-greeting-brand-chip">JedaIn Traveler</div>
          <h1 className="home-greeting-title">{greetingText}</h1>
          <p className="home-greeting-subtitle">
            Mau jeda seperti apa hari ini?
          </p>
        </div>
      </header>

      {/* 2. Pending Payment Banner (conditional) */}
      {pendingPayment && <PendingPaymentBanner summary={pendingPayment} />}
      {moduleErrors?.pendingPayment && (
        <div className="home-module-error" role="alert">
          <p>{moduleErrors.pendingPayment}</p>
        </div>
      )}

      {/* 3. Upcoming Trip Card (conditional) */}
      {upcomingTrip && <UpcomingTripCard summary={upcomingTrip} />}
      {moduleErrors?.upcomingTrip && (
        <div className="home-module-error" role="alert">
          <p>{moduleErrors.upcomingTrip}</p>
        </div>
      )}

      {/* 4. Personalized Recommendation + Preference Summary */}
      <section
        className="home-recommendation-section"
        aria-labelledby="rec-section-title"
      >
        <div className="home-section-header">
          <div className="home-section-header__tag">Personal</div>
          <h2 id="rec-section-title" className="home-section-title">
            {recommendationHeading}
          </h2>
        </div>

        {moduleErrors?.recommendation ? (
          <div className="home-module-error" role="alert">
            <p>{moduleErrors.recommendation}</p>
            <Button variant="secondary" size="sm" onClick={loadData}>
              Coba lagi
            </Button>
          </div>
        ) : recPkg && recItem ? (
          <div className="home-hero-card">
            <div
              className="home-hero-card__visual"
              style={{
                backgroundImage: `url("${getPackageVisual(recPkg.id, recPkg.destinationName).svgDataUri}")`,
              }}
              role="img"
              aria-label={`Ilustrasi suasana ${recPkg.title}`}
            >
              <div className="home-hero-card__visual-scrim" />
              <div className="home-hero-card__visual-badges">
                <Badge tone={recMode === "FALLBACK" ? "neutral" : "success"}>
                  {recMode === "FALLBACK"
                    ? "Pilihan terdekat"
                    : "Pilihan utama"}
                </Badge>
                <Badge tone="neutral">
                  {recPkg.verificationLevel === "PLUS"
                    ? "Terverifikasi Plus"
                    : "Terverifikasi Dasar"}
                </Badge>
              </div>
            </div>
            <div className="home-hero-card__body">
              <div className="home-hero-card__meta">
                <span className="home-hero-card__meta-item">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {recPkg.locationLabel}
                </span>
                <span className="home-hero-card__meta-dot">•</span>
                <span className="home-hero-card__meta-item">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {recDuration}
                </span>
              </div>
              <h3 className="home-hero-card__title">{recPkg.title}</h3>
              <p className="home-hero-card__summary">{recPkg.shortSummary}</p>

              <div className="home-hero-card__price-box">
                <span className="home-hero-card__price-label">Mulai dari</span>
                <div className="home-hero-card__price">
                  <strong>
                    Rp{recPkg.pricePerPerson.toLocaleString("id-ID")}
                  </strong>{" "}
                  <span>/ orang</span>
                </div>
              </div>

              {recItem.reasons.length > 0 && (
                <div className="home-hero-card__why">
                  {recItem.reasons.slice(0, 3).map((r, i) => (
                    <div key={i} className="home-hero-card__chip">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="primary"
                size="md"
                className="home-hero-card__cta"
                onClick={() =>
                  navigate(`/packages/${recPkg.id}`, {
                    state: {
                      personalizedContext: {
                        reasons: recItem.reasons,
                        mode: recMode === "FALLBACK" ? "FALLBACK" : "MATCHED",
                      },
                    },
                  })
                }
              >
                Lihat Experience
              </Button>
            </div>
          </div>
        ) : (
          <div className="home-module-empty">
            <div className="home-module-empty__icon" aria-hidden="true">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
            </div>
            <p>Belum ada rekomendasi personal yang bisa ditampilkan.</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/explore")}
            >
              Jelajahi Experience
            </Button>
          </div>
        )}

        {/* Compact preference summary control */}
        {quizDraft && (
          <div className="home-preference-bar" aria-label="Preferensi saat ini">
            <div className="home-preference-bar__chips">
              <span className="home-preference-bar__label">Preferensi:</span>
              {intentLabel && (
                <span className="home-preference-bar__chip">{intentLabel}</span>
              )}
              {durationLabel && (
                <span className="home-preference-bar__chip">
                  {durationLabel}
                </span>
              )}
              {departureLabel && (
                <span className="home-preference-bar__chip">
                  {departureLabel}
                </span>
              )}
            </div>
            <Link
              to="/profile/preferences"
              className="home-preference-bar__link"
            >
              Ubah preferensi &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* 5. Search Bar */}
      <section className="home-search-section" aria-label="Pencarian JedaIn">
        <SearchBar />
      </section>

      {/* 6. Explore by Mood */}
      <section
        className="home-mood-section"
        aria-labelledby="mood-section-title"
      >
        <div className="home-section-header">
          <h2 id="mood-section-title" className="home-section-title">
            Eksplorasi Berdasarkan Suasana
          </h2>
        </div>
        <div
          className="home-mood-row"
          role="region"
          aria-label="Pilihan suasana"
        >
          {moodPresets.map((mood) => (
            <MoodChip key={mood.id} mood={mood} />
          ))}
        </div>
      </section>

      {/* 7. Popular This Week */}
      <section
        className="home-discovery-section"
        aria-labelledby="popular-section-title"
      >
        <div className="home-section-header">
          <div>
            <h2 id="popular-section-title" className="home-section-title">
              Populer Minggu Ini
            </h2>
          </div>
          <Link to="/explore" className="home-section-header__more">
            Lihat semua &rarr;
          </Link>
        </div>
        {moduleErrors?.popular ? (
          <div className="home-module-error" role="alert">
            <p>{moduleErrors.popular}</p>
          </div>
        ) : (
          <div
            className="home-cards-scroll-row"
            role="region"
            aria-label="Paket populer"
          >
            {popularPackages.slice(0, 4).map((pkg) => (
              <PackageCard key={pkg.id} packageData={pkg} />
            ))}
          </div>
        )}
      </section>

      {/* 8. From Departure Area */}
      <section
        className="home-discovery-section"
        aria-labelledby="departure-section-title"
      >
        <div className="home-section-header">
          <div>
            <h2 id="departure-section-title" className="home-section-title">
              {departureAreaName
                ? `Dari Area ${departureAreaName}`
                : "Berdasarkan Area Keberangkatan"}
            </h2>
          </div>
          <Link
            to={departureExploreHref}
            className="home-section-header__more"
            data-testid="departure-more-link"
          >
            Lihat semua &rarr;
          </Link>
        </div>
        {moduleErrors?.departure ? (
          <div className="home-module-error" role="alert">
            <p>{moduleErrors.departure}</p>
          </div>
        ) : departureAreaPackages.length > 0 ? (
          <div
            className="home-cards-scroll-row"
            role="region"
            aria-label="Paket area keberangkatan"
          >
            {departureAreaPackages.map((pkg) => (
              <PackageCard key={pkg.id} packageData={pkg} />
            ))}
          </div>
        ) : (
          <div className="home-module-empty">
            <p>
              Belum ada paket khusus dari area ini. Temukan paket lain di
              Explore.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/explore")}
            >
              Lihat Semua di Explore &rarr;
            </Button>
          </div>
        )}
      </section>

      {/* 9. Verified Destinations */}
      <section
        className="home-discovery-section"
        aria-labelledby="destinations-section-title"
      >
        <div className="home-section-header">
          <div>
            <h2 id="destinations-section-title" className="home-section-title">
              Destinasi Terverifikasi
            </h2>
          </div>
          <Link to="/explore" className="home-section-header__more">
            Eksplorasi &rarr;
          </Link>
        </div>
        {moduleErrors?.destinations ? (
          <div className="home-module-error" role="alert">
            <p>{moduleErrors.destinations}</p>
          </div>
        ) : (
          <div
            className="home-destinations-scroll-row"
            role="region"
            aria-label="Destinasi terverifikasi"
          >
            {verifiedDestinations.map((dest) => (
              <DestinationCard key={dest.destinationName} destination={dest} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
