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
      {/* A. Header + aggregate-data notice */}
      <header className="eo-demand-header">
        <div className="eo-demand-header__title-group">
          <h1>Insight Permintaan Traveler</h1>
          <p className="eo-demand-header__subtitle">
            Pahami pola kebutuhan traveler dan ubah sinyal demand menjadi
            experience yang relevan.
          </p>
        </div>
        <aside
          className="eo-demand-notice"
          aria-label="Catatan privasi dan sumber data agregat"
        >
          <span className="eo-demand-notice__icon" aria-hidden="true">
            ℹ
          </span>
          <p className="eo-demand-notice__text">
            Simulasi data agregat dari{" "}
            {totalTravelerResponses.toLocaleString("id-ID")} respons preferensi
            traveler. Tidak menampilkan data pribadi traveler.
          </p>
        </aside>
      </header>

      {/* B. Top Signal Summary Band: Sinyal teratas per dimensi (independent winners) */}
      <section
        className="eo-demand-signals-band"
        aria-label="Sinyal teratas per dimensi kebutuhan traveler"
      >
        <div className="eo-demand-signal-stat">
          <span className="eo-demand-signal-stat__label">Kebutuhan Utama</span>
          <span className="eo-demand-signal-stat__pct">
            {topIntent.percentage}%
          </span>
          <strong className="eo-demand-signal-stat__value">
            {topIntent.intentLabel}
          </strong>
          <span className="eo-demand-signal-stat__detail">
            {topIntent.travelerCount} traveler
          </span>
        </div>

        <div className="eo-demand-signal-stat">
          <span className="eo-demand-signal-stat__label">Budget Terbanyak</span>
          <span className="eo-demand-signal-stat__pct">
            {topBudget.percentage}%
          </span>
          <strong className="eo-demand-signal-stat__value">
            {topBudget.label}
          </strong>
          <span className="eo-demand-signal-stat__detail">
            {topBudget.count} traveler
          </span>
        </div>

        <div className="eo-demand-signal-stat">
          <span className="eo-demand-signal-stat__label">Durasi Terbanyak</span>
          <span className="eo-demand-signal-stat__pct">
            {topDuration.percentage}%
          </span>
          <strong className="eo-demand-signal-stat__value">
            {topDuration.label}
          </strong>
          <span className="eo-demand-signal-stat__detail">
            {topDuration.count} traveler
          </span>
        </div>

        <div className="eo-demand-signal-stat">
          <span className="eo-demand-signal-stat__label">
            Area Keberangkatan Terbesar
          </span>
          <span className="eo-demand-signal-stat__pct">
            {topDeparture.percentage}%
          </span>
          <strong className="eo-demand-signal-stat__value">
            {topDeparture.label}
          </strong>
          <span className="eo-demand-signal-stat__detail">
            {topDeparture.count} traveler
          </span>
        </div>
      </section>

      {/* C. Opportunities Moved UP: Peluang yang Belum Terpenuhi */}
      <section
        className="eo-demand-opportunities"
        aria-label="Peluang yang belum terpenuhi"
      >
        <div className="eo-demand-section__header">
          <div className="eo-demand-section__header-text">
            <h2>Peluang yang Belum Terpenuhi</h2>
            <p>
              Pilih creative brief berdasarkan kebutuhan yang belum banyak
              terlayani, lalu gunakan konteksnya saat merancang paket.
            </p>
          </div>
          <div className="eo-demand-creative-brief-note">
            Insight adalah creative brief dari kebutuhan traveler. EO tetap
            menentukan konsep, itinerary, dan pengalaman akhirnya.
          </div>
        </div>

        {/* Featured Opportunity: Cohesive Creator Brief without card-in-card nesting */}
        {featuredInsight && (
          <article
            className="eo-demand-featured-card"
            aria-label={`Peluang utama: ${featuredInsight.title}`}
          >
            <div className="eo-demand-featured-card__layout">
              {/* Left / Main (~60%) */}
              <div className="eo-demand-featured-card__main">
                <div className="eo-demand-featured-card__eyebrow">
                  <span className="eo-demand-badge-featured">
                    Peluang Utama
                  </span>
                  <span className="eo-demand-featured-card__demand-stat">
                    <strong>{featuredInsight.travelerDemandCount}</strong>{" "}
                    traveler mencari
                  </span>
                </div>

                <h3 className="eo-demand-featured-card__title">
                  {featuredInsight.title}
                </h3>
                <p className="eo-demand-featured-card__desc">
                  {featuredInsight.unmetDemandDescription}
                </p>

                {/* Source-backed facts: quiet inline facts, no pill soup */}
                <dl className="eo-demand-featured-facts">
                  <div className="eo-demand-fact-item">
                    <dt>Asal traveler</dt>
                    <dd>{featuredInsight.targetArea}</dd>
                  </div>
                  <div className="eo-demand-fact-item">
                    <dt>Durasi</dt>
                    <dd>{featuredInsight.durationLabel}</dd>
                  </div>
                  <div className="eo-demand-fact-item">
                    <dt>Budget</dt>
                    <dd>{featuredInsight.preferredBudgetRange}</dd>
                  </div>
                  <div className="eo-demand-fact-item">
                    <dt>Kebutuhan</dt>
                    <dd>{featuredInsight.intentLabel}</dd>
                  </div>
                </dl>
              </div>

              {/* Right / Support (~40%) */}
              <div className="eo-demand-featured-card__support">
                <div className="eo-demand-brief-column">
                  <h4 className="eo-demand-brief-heading">Arah Kurasi</h4>
                  <ul className="eo-demand-brief-list">
                    {featuredInsight.recommendedFocus.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>

                {featuredInsight.sampleActivities && (
                  <div className="eo-demand-brief-column">
                    <h4 className="eo-demand-brief-heading">
                      Contoh Aktivitas
                    </h4>
                    <ul className="eo-demand-brief-list">
                      {featuredInsight.sampleActivities.map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Action Row */}
            <div className="eo-demand-featured-card__action-row">
              <p className="eo-demand-featured-card__action-hint">
                Gunakan insight sebagai arahan. Itinerary tetap disusun oleh EO.
              </p>
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
                aria-label={`Peluang sekunder: ${item.title}`}
              >
                <div className="eo-demand-secondary-card__body">
                  <div className="eo-demand-secondary-card__eyebrow">
                    <span className="eo-demand-secondary-card__intent">
                      {item.intentLabel}
                    </span>
                    <span className="eo-demand-secondary-card__demand">
                      <strong>{item.travelerDemandCount}</strong> traveler
                    </span>
                  </div>

                  <h4 className="eo-demand-secondary-card__title">
                    {item.title}
                  </h4>
                  <p className="eo-demand-secondary-card__desc">
                    {item.unmetDemandDescription}
                  </p>

                  <div className="eo-demand-secondary-card__facts">
                    <span>
                      <span className="eo-demand-fact-label">
                        Asal traveler
                      </span>{" "}
                      · {item.targetArea}
                    </span>
                    <span>
                      <span className="eo-demand-fact-label">Durasi</span> ·{" "}
                      {item.durationLabel}
                    </span>
                    <span>
                      <span className="eo-demand-fact-label">Budget</span> ·{" "}
                      {item.preferredBudgetRange}
                    </span>
                  </div>

                  <div className="eo-demand-secondary-card__curation">
                    <span className="eo-demand-brief-heading">
                      Arah Kurasi:
                    </span>
                    <ul className="eo-demand-brief-list">
                      {item.recommendedFocus.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="eo-demand-secondary-card__footer">
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

      {/* D. Detailed Supporting Distributions: Rincian Pola Permintaan in a Compact 2x2 Grid */}
      <section
        className="eo-demand-details-section"
        aria-label="Rincian pola permintaan traveler"
      >
        <div className="eo-demand-section__header">
          <h2>Rincian Pola Permintaan</h2>
          <p>
            Lihat distribusi tiap dimensi secara terpisah untuk memahami konteks
            demand.
          </p>
        </div>

        <div className="eo-demand-details-grid">
          {/* 1. Kebutuhan Traveler (Intent) */}
          <div
            className="eo-demand-detail-block"
            aria-label="Distribusi preferensi suasana traveler"
          >
            <div className="eo-demand-detail-block__header">
              <h3>Kebutuhan Traveler</h3>
              <p>Preferensi suasana dan ritme perjalanan pada data agregat.</p>
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
          </div>

          {/* 2. Area Keberangkatan (Departures) */}
          <div
            className="eo-demand-detail-block"
            aria-label="Distribusi wilayah asal keberangkatan"
          >
            <div className="eo-demand-detail-block__header">
              <h3>Area Keberangkatan</h3>
              <p>Titik awal keberangkatan traveler pada data agregat.</p>
            </div>
            <div className="eo-demand-bar-list">
              {departures.map((dep) => (
                <div key={dep.id} className="eo-demand-bar-row">
                  <div className="eo-demand-bar-row__top">
                    <span className="eo-demand-bar-row__label">
                      {dep.label}
                    </span>
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
          </div>

          {/* 3. Budget Nyaman */}
          <div
            className="eo-demand-detail-block"
            aria-label="Distribusi budget nyaman traveler"
          >
            <div className="eo-demand-detail-block__header">
              <h3>Budget Nyaman</h3>
              <p>
                Rentang budget per orang yang paling realistis bagi traveler.
              </p>
            </div>
            <div className="eo-demand-bar-list">
              {budgets.map((b) => (
                <div key={b.id} className="eo-demand-bar-row">
                  <div className="eo-demand-bar-row__top">
                    <span className="eo-demand-bar-row__label">{b.label}</span>
                    <span className="eo-demand-bar-row__metric">
                      <strong>{b.percentage}%</strong> ({b.count} traveler)
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

          {/* 4. Durasi yang Dicari */}
          <div
            className="eo-demand-detail-block"
            aria-label="Distribusi durasi waktu traveler"
          >
            <div className="eo-demand-detail-block__header">
              <h3>Durasi yang Dicari</h3>
              <p>
                Waktu realistis yang dimiliki traveler untuk jeda perjalanan.
              </p>
            </div>
            <div className="eo-demand-bar-list">
              {durations.map((d) => (
                <div key={d.id} className="eo-demand-bar-row">
                  <div className="eo-demand-bar-row__top">
                    <span className="eo-demand-bar-row__label">{d.label}</span>
                    <span className="eo-demand-bar-row__metric">
                      <strong>{d.percentage}%</strong> ({d.count} traveler)
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
      </section>
    </div>
  );
}
