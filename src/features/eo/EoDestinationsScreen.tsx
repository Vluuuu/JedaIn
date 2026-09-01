import { useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockDestinationStore } from "./mockDestinationStore";
import { partnerSessionStore } from "./partnerSessionStore";
import "./eo.css";

export function EoDestinationsScreen() {
  const navigate = useNavigate();
  const partner = partnerSessionStore.get();
  const guideStatus = partner?.guideStatus ?? "CERTIFIED_GUIDE";
  const destinations = mockDestinationStore.getAll();

  const handleCreatePackage = (destinationId: string) => {
    navigate(`/partner/eo/packages/new?destinationId=${destinationId}`);
  };

  return (
    <div className="eo-container">
      <header className="eo-page-header">
        <div>
          <Badge tone="info">Direktori Destinasi Terverifikasi</Badge>
          <h1 className="eo-page-title" style={{ marginTop: "var(--space-2)" }}>
            Destinasi Terverifikasi JedaIn
          </h1>
          <p className="eo-page-subtitle">
            Pilihan lokasi alam dan ruang tenang yang telah melalui proses
            kurasi standar BASIC / PLUS untuk dirancang menjadi paket wellness.
          </p>
        </div>
      </header>

      {/* Guide Readiness Information Alert */}
      <div className="eo-alert eo-alert--info">
        <strong>Ketentuan Kesiapan Pemandu (Guide Readiness):</strong>
        <p style={{ margin: "var(--space-1) 0 0" }}>
          Status Anda:{" "}
          <strong>
            {guideStatus === "CERTIFIED_GUIDE"
              ? "Certified Guide"
              : "Concept-Only"}
          </strong>
          .{" "}
          {guideStatus === "CONCEPT_ONLY"
            ? "Anda wajib memilih destinasi berstatus Guide Ready (memiliki pemandu lokal terlatih di lokasi)."
            : "Anda dapat memilih seluruh destinasi terverifikasi BASIC maupun PLUS."}
        </p>
      </div>

      {/* Destination Cards Grid */}
      <section
        className="eo-destinations-grid"
        aria-label="Katalog destinasi mitra"
      >
        {destinations.map((dest) => {
          const isEligible =
            guideStatus === "CERTIFIED_GUIDE" || dest.guideReady === true;

          return (
            <article
              key={dest.destinationId}
              className={`eo-destination-card ${!isEligible ? "eo-destination-card--disabled" : ""}`}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    gap: "var(--space-2)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  <Badge
                    tone={
                      dest.verificationLevel === "PLUS" ? "info" : "success"
                    }
                  >
                    {dest.verificationLevel === "PLUS"
                      ? "Verifikasi PLUS"
                      : "Verifikasi BASIC"}
                  </Badge>
                  <Badge tone={dest.guideReady ? "success" : "neutral"}>
                    {dest.guideReady ? "Guide Ready ✓" : "Tanpa Guide Lokal"}
                  </Badge>
                </div>

                <h2
                  style={{
                    fontSize: "var(--font-size-heading-sm)",
                    margin: "0 0 var(--space-1)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {dest.name}
                </h2>
                <p
                  style={{
                    fontSize: "var(--font-size-caption)",
                    color: "var(--color-text-secondary)",
                    margin: "0 0 var(--space-2)",
                  }}
                >
                  {dest.locationLabel}
                </p>
                <p
                  style={{
                    fontSize: "var(--font-size-body-sm)",
                    color: "var(--color-text-secondary)",
                    margin: 0,
                  }}
                >
                  {dest.description}
                </p>

                {dest.highlights && dest.highlights.length > 0 && (
                  <ul
                    style={{
                      margin: "var(--space-3) 0 0",
                      paddingLeft: "1.25rem",
                      fontSize: "var(--font-size-caption)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {dest.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>

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
                    Modal Dasar:
                  </small>
                  <strong
                    style={{
                      display: "block",
                      color: "var(--color-brand-primary)",
                      fontSize: "var(--font-size-body-sm)",
                    }}
                  >
                    Rp{dest.baseCostPerPerson.toLocaleString("id-ID")} / orang
                  </strong>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={!isEligible}
                  onClick={() => handleCreatePackage(dest.destinationId)}
                >
                  {isEligible
                    ? "Buat Paket di Sini &rarr;"
                    : "Tidak Memenuhi Syarat Guide"}
                </Button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
