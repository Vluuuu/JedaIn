import { useNavigate } from "react-router";
import { Button } from "../../components/ui";
import { mockInsightStore } from "./mockInsightStore";
import "./eo.css";

export function EoInsightsScreen() {
  const navigate = useNavigate();
  const signals = mockInsightStore.getSignals();
  const budgets = mockInsightStore.getBudgetDistribution();
  const durations = mockInsightStore.getDurationDistribution();
  const departures = mockInsightStore.getDepartureDistribution();
  const insights = mockInsightStore.getAllInsights();

  // Dynamic derivation of total responses (e.g. 1.020)
  const totalTravelerResponses = signals.reduce(
    (sum, sig) => sum + sig.travelerCount,
    0,
  );

  // Derive top signals dynamically
  const topIntent = [...signals].sort((a, b) => b.percentage - a.percentage)[0];
  const topBudget = [...budgets].sort((a, b) => b.percentage - a.percentage)[0];
  const topDuration = [...durations].sort(
    (a, b) => b.percentage - a.percentage,
  )[0];
  const topDeparture = [...departures].sort(
    (a, b) => b.percentage - a.percentage,
  )[0];

  // Sort unmet demand insights by demand count descending
  const sortedInsights = [...insights].sort(
    (a, b) => b.travelerDemandCount - a.travelerDemandCount,
  );
  const featuredInsight = sortedInsights[0];
  const secondaryInsights = sortedInsights.slice(1);

  const handleCreateFromInsight = (insightId: string) => {
    navigate(`/partner/eo/packages/new?insightId=${insightId}`);
  };

  return (
    <div className="eo-demand-container">
      {/* 20. Clean Page Header without redundant badges */}
      <header className="eo-demand-header">
        <h1>Demand Insights</h1>
        <p className="eo-demand-header__subtitle">
          Kenali pola kebutuhan traveler sebelum menyusun experience.
        </p>
        <p className="eo-demand-header__meta">
          Data agregat prototipe · Simulasi sinyal agregat dari{" "}
          {totalTravelerResponses.toLocaleString("id-ID")} respons preferensi
          traveler untuk memandu perancangan paket yang tepat sasaran.
        </p>
      </header>

      {/* 22. Top Signal Summary Band: Editorial metric band */}
      <section
        className="eo-demand-signals-band"
        aria-label="Ringkasan sinyal utama traveler"
      >
        <div className="eo-demand-signal-stat">
          <span className="eo-demand-signal-stat__label">Suasana Teratas</span>
          <strong className="eo-demand-signal-stat__value">
            {topIntent.intentLabel}
          </strong>
          <span className="eo-demand-signal-stat__detail">
            {topIntent.percentage}% ({topIntent.travelerCount} traveler)
          </span>
        </div>

        <div className="eo-demand-signal-stat">
          <span className="eo-demand-signal-stat__label">Budget Terbanyak</span>
          <strong className="eo-demand-signal-stat__value">
            {topBudget.label}
          </strong>
          <span className="eo-demand-signal-stat__detail">
            {topBudget.percentage}% ({topBudget.count} traveler)
          </span>
        </div>

        <div className="eo-demand-signal-stat">
          <span className="eo-demand-signal-stat__label">
            Durasi Terfavorit
          </span>
          <strong className="eo-demand-signal-stat__value">
            {topDuration.label}
          </strong>
          <span className="eo-demand-signal-stat__detail">
            {topDuration.percentage}% ({topDuration.count} traveler)
          </span>
        </div>

        <div className="eo-demand-signal-stat">
          <span className="eo-demand-signal-stat__label">Asal Terbesar</span>
          <strong className="eo-demand-signal-stat__value">
            {topDeparture.label}
          </strong>
          <span className="eo-demand-signal-stat__detail">
            {topDeparture.percentage}% ({topDeparture.count} traveler)
          </span>
        </div>
      </section>

      {/* 23. Intent Distribution (Kebutuhan Traveler) */}
      <section
        className="eo-demand-section"
        aria-label="Distribusi preferensi suasana traveler"
      >
        <div className="eo-demand-section__header">
          <h2>Kebutuhan Traveler</h2>
          <p>
            Data agregat preferensi suasana perjalanan yang dicari traveler.
          </p>
        </div>

        <div className="eo-demand-bar-list">
          {signals.map((sig) => (
            <div key={sig.intent} className="eo-demand-bar-row">
              <div className="eo-demand-bar-row__top">
                <span className="eo-demand-bar-row__label">
                  {sig.intentLabel}
                </span>
                <span className="eo-demand-bar-row__metric">
                  <strong>{sig.percentage}%</strong> ({sig.travelerCount}{" "}
                  traveler)
                </span>
              </div>
              <div className="eo-demand-bar-track">
                <div
                  className="eo-demand-bar-fill"
                  style={{ width: `${sig.percentage}%` }}
                  aria-valuenow={sig.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  role="progressbar"
                />
              </div>
              <p className="eo-demand-bar-row__desc">{sig.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 24. Budget + Duration: One shared visual region with internal divider */}
      <div className="eo-demand-dual-section">
        {/* Budget Distribution */}
        <div
          className="eo-demand-dual-column"
          aria-label="Distribusi budget nyaman traveler"
        >
          <div className="eo-demand-section__header">
            <h2>Budget Nyaman</h2>
            <p>Rentang budget per orang yang paling realistis bagi traveler.</p>
          </div>

          <div className="eo-demand-bar-list">
            {budgets.map((b) => (
              <div key={b.id} className="eo-demand-bar-row">
                <div className="eo-demand-bar-row__top">
                  <span className="eo-demand-bar-row__label">{b.label}</span>
                  <span className="eo-demand-bar-row__metric">
                    <strong>{b.percentage}%</strong> ({b.count})
                  </span>
                </div>
                <div className="eo-demand-bar-track">
                  <div
                    className="eo-demand-bar-fill eo-demand-bar-fill--sand"
                    style={{ width: `${b.percentage}%` }}
                    aria-valuenow={b.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    role="progressbar"
                  />
                </div>
                {b.description && (
                  <p className="eo-demand-bar-row__desc">{b.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Duration Distribution */}
        <div
          className="eo-demand-dual-column"
          aria-label="Distribusi durasi waktu traveler"
        >
          <div className="eo-demand-section__header">
            <h2>Durasi yang Dicari</h2>
            <p>Waktu realistis yang dimiliki traveler untuk jeda perjalanan.</p>
          </div>

          <div className="eo-demand-bar-list">
            {durations.map((d) => (
              <div key={d.id} className="eo-demand-bar-row">
                <div className="eo-demand-bar-row__top">
                  <span className="eo-demand-bar-row__label">{d.label}</span>
                  <span className="eo-demand-bar-row__metric">
                    <strong>{d.percentage}%</strong> ({d.count})
                  </span>
                </div>
                <div className="eo-demand-bar-track">
                  <div
                    className="eo-demand-bar-fill"
                    style={{ width: `${d.percentage}%` }}
                    aria-valuenow={d.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    role="progressbar"
                  />
                </div>
                {d.description && (
                  <p className="eo-demand-bar-row__desc">{d.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 25. Departure Area Distribution: Ranked rows with bar */}
      <section
        className="eo-demand-section"
        aria-label="Distribusi wilayah asal keberangkatan"
      >
        <div className="eo-demand-section__header">
          <h2>Area Keberangkatan</h2>
          <p>Titik awal keberangkatan traveler di Jawa Timur.</p>
        </div>

        <div className="eo-demand-bar-list">
          {departures.map((dep) => (
            <div key={dep.id} className="eo-demand-bar-row">
              <div className="eo-demand-bar-row__top">
                <span className="eo-demand-bar-row__label">{dep.label}</span>
                <span className="eo-demand-bar-row__metric">
                  <strong>{dep.percentage}%</strong> ({dep.count} traveler)
                </span>
              </div>
              <div className="eo-demand-bar-track">
                <div
                  className="eo-demand-bar-fill"
                  style={{ width: `${dep.percentage}%` }}
                  aria-valuenow={dep.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  role="progressbar"
                />
              </div>
              <p className="eo-demand-bar-row__desc">{dep.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 26 & 27. Unmet Demand Section: Featured Large + Secondary Compact */}
      <section
        className="eo-demand-opportunities"
        aria-label="Peluang paket yang belum terpenuhi"
      >
        <div className="eo-demand-section__header">
          <h2>Peluang yang Belum Terpenuhi</h2>
          <p>
            Pilih peluang sinyal permintaan di bawah untuk langsung membuka Trip
            Builder dengan parameter konteks terkait.
          </p>
        </div>

        {/* Featured Opportunity */}
        {featuredInsight && (
          <article className="eo-demand-featured-card">
            <div className="eo-demand-featured-card__top">
              <div className="eo-demand-featured-card__meta-tags">
                <span className="eo-demand-tag eo-demand-tag--featured">
                  Peluang Utama
                </span>
                <span className="eo-demand-tag eo-demand-tag--primary">
                  {featuredInsight.intentLabel}
                </span>
                <span className="eo-demand-tag">
                  {featuredInsight.durationLabel}
                </span>
                <span className="eo-demand-tag">
                  {featuredInsight.targetArea}
                </span>
              </div>
              <span className="eo-demand-tag eo-demand-tag--primary">
                <strong>{featuredInsight.travelerDemandCount}</strong> traveler
                mencari
              </span>
            </div>

            <h3>{featuredInsight.title}</h3>
            <p className="eo-demand-featured-card__desc">
              {featuredInsight.unmetDemandDescription}
            </p>

            <div className="eo-demand-curation-box">
              <strong>Arah Kurasi & Rekomendasi Fokus:</strong>
              <ul>
                {featuredInsight.recommendedFocus.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>

            {featuredInsight.sampleActivities && (
              <div className="eo-demand-curation-box">
                <strong>Contoh Aktivitas Cocok:</strong>
                <ul>
                  {featuredInsight.sampleActivities.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="eo-demand-featured-card__footer">
              <div className="eo-demand-featured-card__budget">
                <small>Kisaran Budget Nyaman</small>
                <strong>{featuredInsight.preferredBudgetRange}</strong>
              </div>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() =>
                  handleCreateFromInsight(featuredInsight.insightId)
                }
              >
                Buat Paket dari Insight &rarr;
              </Button>
            </div>
          </article>
        )}

        {/* Secondary Opportunities */}
        {secondaryInsights.length > 0 && (
          <div className="eo-demand-secondary-grid">
            {secondaryInsights.map((item) => (
              <article
                key={item.insightId}
                className="eo-demand-secondary-card"
              >
                <div>
                  <div className="eo-demand-featured-card__meta-tags">
                    <span className="eo-demand-tag eo-demand-tag--primary">
                      {item.intentLabel}
                    </span>
                    <span className="eo-demand-tag">{item.durationLabel}</span>
                    <span className="eo-demand-tag">{item.targetArea}</span>
                  </div>

                  <h4>{item.title}</h4>
                  <p>{item.unmetDemandDescription}</p>

                  <div
                    className="eo-demand-curation-box"
                    style={{ marginTop: "var(--space-3)" }}
                  >
                    <strong>Arah Kurasi:</strong>
                    <ul>
                      {item.recommendedFocus.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="eo-demand-secondary-card__footer">
                  <div className="eo-demand-featured-card__budget">
                    <small>Budget Nyaman</small>
                    <strong>{item.preferredBudgetRange}</strong>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCreateFromInsight(item.insightId)}
                  >
                    Buat Paket &rarr;
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
