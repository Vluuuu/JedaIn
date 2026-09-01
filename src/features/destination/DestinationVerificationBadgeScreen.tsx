import { Badge } from "../../components/ui";
import { resolveAuthenticatedDestinationContext } from "./destinationContext";
import "./destination.css";

export function DestinationVerificationBadgeScreen() {
  const context = resolveAuthenticatedDestinationContext();
  const destination = context?.destination;

  const verificationLevel = destination?.verificationLevel ?? "BASIC";
  const guideReady = destination?.guideReady ?? true;

  return (
    <div className="dest-container" style={{ maxWidth: "960px" }}>
      <header className="dest-page-header">
        <div>
          <Badge tone="info">Status & Dimensi Standar JedaIn</Badge>
          <h1
            className="dest-page-title"
            style={{ marginTop: "var(--space-2)" }}
          >
            Verifikasi & Lencana Kualitas Destinasi
          </h1>
          <p className="dest-page-subtitle">
            JedaIn memisahkan secara independen antara tingkat verifikasi kurasi
            fasilitas dan kesiapan pemandu lokal di lokasi.
          </p>
        </div>
      </header>

      {/* Two-Dimension Grid (DP07 Core) */}
      <section
        className="dest-verification-grid"
        aria-label="Dua dimensi verifikasi"
      >
        {/* Dimension 1: Verification Level */}
        <article className="dest-badge-card dest-badge-card--active">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Badge tone="success">Dimensi 1: Verifikasi Fasilitas</Badge>
            <Badge tone={verificationLevel === "PLUS" ? "info" : "neutral"}>
              Level {verificationLevel}
            </Badge>
          </div>

          <h2
            style={{
              fontSize: "var(--font-size-heading-md)",
              margin: "var(--space-1) 0",
            }}
          >
            {verificationLevel === "PLUS"
              ? "Terverifikasi PLUS"
              : "Terverifikasi Dasar (BASIC)"}
          </h2>

          <p
            style={{
              fontSize: "var(--font-size-body-sm)",
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            {verificationLevel === "PLUS"
              ? "PLUS adalah level verifikasi lanjutan dari trust lifecycle."
              : "BASIC menunjukkan destinasi telah melewati verifikasi dasar JedaIn pada tahap MVP."}
          </p>

          <div
            style={{
              borderTop: "1px solid var(--color-border-default)",
              paddingTop: "var(--space-3)",
              fontSize: "var(--font-size-caption)",
              color: "var(--color-text-muted)",
            }}
          >
            {verificationLevel === "BASIC"
              ? "Status PLUS dapat diberikan melalui kurasi trust lifecycle berkala oleh tim Admin JedaIn."
              : "Lencana terverifikasi aktif."}
          </div>
        </article>

        {/* Dimension 2: Guide Capability */}
        <article
          className={`dest-badge-card ${guideReady ? "dest-badge-card--active" : ""}`}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Badge tone="info">Dimensi 2: Pemandu Lokal</Badge>
            <Badge tone={guideReady ? "success" : "neutral"}>
              {guideReady ? "Guide Ready ✓" : "Tanpa Guide Lokal"}
            </Badge>
          </div>

          <h2
            style={{
              fontSize: "var(--font-size-heading-md)",
              margin: "var(--space-1) 0",
            }}
          >
            {guideReady
              ? "Siap sebagai Pemandu (Guide Ready)"
              : "Belum Memiliki Pemandu Lokal"}
          </h2>

          <p
            style={{
              fontSize: "var(--font-size-body-sm)",
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            {guideReady
              ? "Destinasi memiliki pemandu lokal yang siap memandu rute sehingga dapat dipilih oleh EO bertipe Concept-Only."
              : "Destinasi belum menyediakan pemandu lokal tetap di lokasi, sehingga hanya dapat dipilih oleh EO yang membawa Certified Guide sendiri."}
          </p>

          <div
            style={{
              borderTop: "1px solid var(--color-border-default)",
              paddingTop: "var(--space-3)",
              fontSize: "var(--font-size-caption)",
              color: "var(--color-text-muted)",
            }}
          >
            Kesiapan pemandu diverifikasi berdasarkan bukti warga binaan
            setempat.
          </div>
        </article>
      </section>
    </div>
  );
}
