import { useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockInsightStore } from "./mockInsightStore";
import "./eo.css";

export function EoInsightsScreen() {
  const navigate = useNavigate();
  const signals = mockInsightStore.getSignals();
  const budgets = mockInsightStore.getBudgetDistribution();
  const durations = mockInsightStore.getDurationDistribution();
  const departures = mockInsightStore.getDepartureDistribution();
  const insights = mockInsightStore.getAllInsights();

  const handleCreateFromInsight = (insightId: string) => {
    navigate(`/partner/eo/packages/new?insightId=${insightId}`);
  };

  return (
    <div className="eo-container">
      <header className="eo-page-header">
        <div>
          <Badge tone="info">Aggregate Demand Engine</Badge>
          <h1 className="eo-page-title" style={{ marginTop: "var(--space-2)" }}>
            Demand Insights & Wawasan Kebutuhan Traveler
          </h1>
          <p className="eo-page-subtitle">
            Simulasi sinyal agregat dari 1.020 respons preferensi kuis traveler
            untuk memandu EO menyusun paket wellness yang tepat sasaran.
          </p>
        </div>
      </header>

      {/* 1. Suasana / Intent Distribution */}
      <section
        className="eo-section"
        aria-label="Distribusi preferensi suasana traveler"
      >
        <div className="eo-section-header">
          <div>
            <h2 className="eo-section-title">
              1. Distribusi Kebutuhan Suasana (Intent Signal)
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "var(--font-size-caption)",
                color: "var(--color-text-secondary)",
              }}
            >
              Data agregat preferensi suasana perjalanan traveler.
            </p>
          </div>
        </div>

        <div className="eo-signal-bar-list">
          {signals.map((sig) => (
            <div key={sig.intent} className="eo-signal-bar-row">
              <div className="eo-signal-bar-labels">
                <span>
                  <strong>{sig.intentLabel}</strong> ({sig.description})
                </span>
                <span>
                  <strong>{sig.percentage}%</strong> ({sig.travelerCount}{" "}
                  traveler)
                </span>
              </div>
              <div className="eo-signal-bar-track">
                <div
                  className="eo-signal-bar-fill"
                  style={{ width: `${sig.percentage}%` }}
                  aria-valuenow={sig.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  role="progressbar"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2 & 3. Budget & Duration Distribution Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--space-6)",
        }}
      >
        {/* 2. Budget Distribution */}
        <section
          className="eo-section"
          aria-label="Distribusi budget nyaman traveler"
        >
          <div className="eo-section-header">
            <div>
              <h2 className="eo-section-title">2. Distribusi Budget Nyaman</h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Rentang budget per orang yang paling realistis bagi traveler.
              </p>
            </div>
          </div>

          <div className="eo-signal-bar-list">
            {budgets.map((b) => (
              <div key={b.id} className="eo-signal-bar-row">
                <div className="eo-signal-bar-labels">
                  <span>
                    <strong>{b.label}</strong>
                  </span>
                  <span>
                    <strong>{b.percentage}%</strong> ({b.count})
                  </span>
                </div>
                <div className="eo-signal-bar-track">
                  <div
                    className="eo-signal-bar-fill"
                    style={{
                      width: `${b.percentage}%`,
                      background: "var(--color-sand-600)",
                    }}
                    aria-valuenow={b.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    role="progressbar"
                  />
                </div>
                {b.description && (
                  <span
                    style={{
                      fontSize: "var(--font-size-caption)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {b.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 3. Duration Distribution */}
        <section
          className="eo-section"
          aria-label="Distribusi durasi waktu traveler"
        >
          <div className="eo-section-header">
            <div>
              <h2 className="eo-section-title">
                3. Distribusi Durasi Perjalanan
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Waktu realistis yang dimiliki traveler untuk jeda perjalanan.
              </p>
            </div>
          </div>

          <div className="eo-signal-bar-list">
            {durations.map((d) => (
              <div key={d.id} className="eo-signal-bar-row">
                <div className="eo-signal-bar-labels">
                  <span>
                    <strong>{d.label}</strong>
                  </span>
                  <span>
                    <strong>{d.percentage}%</strong> ({d.count})
                  </span>
                </div>
                <div className="eo-signal-bar-track">
                  <div
                    className="eo-signal-bar-fill"
                    style={{
                      width: `${d.percentage}%`,
                      background: "var(--color-forest-600)",
                    }}
                    aria-valuenow={d.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    role="progressbar"
                  />
                </div>
                {d.description && (
                  <span
                    style={{
                      fontSize: "var(--font-size-caption)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {d.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 4. Departure Area Distribution */}
      <section
        className="eo-section"
        aria-label="Distribusi wilayah asal keberangkatan"
      >
        <div className="eo-section-header">
          <div>
            <h2 className="eo-section-title">
              4. Distribusi Wilayah Asal Keberangkatan
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "var(--font-size-caption)",
                color: "var(--color-text-secondary)",
              }}
            >
              Titik awal keberangkatan traveler di Jawa Timur.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {departures.map((dep) => (
            <div
              key={dep.id}
              style={{
                padding: "var(--space-4)",
                background: "var(--color-bg-surface-subtle)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border-default)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong style={{ fontSize: "var(--font-size-body-md)" }}>
                  {dep.label}
                </strong>
                <Badge tone="info">{dep.percentage}%</Badge>
              </div>
              <p
                style={{
                  margin: "var(--space-2) 0 0",
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {dep.description} ({dep.count} traveler)
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Unmet Demand Opportunities / Opportunity Cards */}
      <section
        className="eo-section"
        aria-label="Peluang paket yang belum terpenuhi"
      >
        <div className="eo-section-header">
          <div>
            <h2 className="eo-section-title">
              5. Peluang Paket Belum Terpenuhi (Unmet Demand)
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "var(--font-size-caption)",
                color: "var(--color-text-secondary)",
              }}
            >
              Pilih peluang insight di bawah untuk langsung membuka Trip Builder
              dengan konteks permintaan terkait.
            </p>
          </div>
        </div>

        <div className="eo-insights-grid">
          {insights.map((item) => (
            <article key={item.insightId} className="eo-insight-card">
              <div>
                <div className="eo-insight-badge-row">
                  <Badge tone="success">{item.intentLabel}</Badge>
                  <Badge tone="neutral">{item.durationLabel}</Badge>
                  <Badge tone="warning">{item.targetArea}</Badge>
                </div>

                <h3 className="eo-insight-title">{item.title}</h3>
                <p className="eo-insight-desc">{item.unmetDemandDescription}</p>

                <div
                  style={{
                    marginTop: "var(--space-3)",
                    padding: "var(--space-3)",
                    background: "var(--color-bg-surface-subtle)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "var(--font-size-caption)",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      color: "var(--color-text-primary)",
                      marginBottom: "var(--space-1)",
                    }}
                  >
                    Rekomendasi Fokus Kurasi:
                  </strong>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "1.25rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {item.recommendedFocus.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid var(--color-border-default)",
                  paddingTop: "var(--space-3)",
                }}
              >
                <div>
                  <small
                    style={{
                      color: "var(--color-text-muted)",
                      display: "block",
                    }}
                  >
                    Kisaran Budget Nyaman:
                  </small>
                  <strong
                    style={{
                      fontSize: "var(--font-size-body-sm)",
                      color: "var(--color-brand-primary)",
                    }}
                  >
                    {item.preferredBudgetRange}
                  </strong>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleCreateFromInsight(item.insightId)}
                >
                  Buat Paket dari Insight Ini &rarr;
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
