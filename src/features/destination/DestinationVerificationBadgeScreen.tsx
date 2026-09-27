import { Badge } from "../../components/ui";
import { resolveAuthenticatedDestinationContext } from "./destinationContext";
import "./destination.css";

export function DestinationVerificationBadgeScreen() {
  const context = resolveAuthenticatedDestinationContext();
  if (!context) {
    return (
      <div className="dest-container" style={{ padding: "var(--space-8)" }}>
        <div className="admin-alert admin-alert--warning">
          <h2>Status Verifikasi Tidak Tersedia</h2>
          <p>Status verifikasi destinasi tidak tersedia untuk akun ini.</p>
        </div>
      </div>
    );
  }

  const { destination } = context;
  const isPlus = destination.verificationLevel === "PLUS";

  return (
    <div className="dest-container" style={{ maxWidth: "760px" }}>
      <header className="dest-page-header">
        <div>
          <Badge tone="success">
            {isPlus ? "Terverifikasi Plus" : "Terverifikasi Dasar"}
          </Badge>
          <h1
            className="dest-page-title"
            style={{ marginTop: "var(--space-2)" }}
          >
            Status Verifikasi Destinasi
          </h1>
          <p className="dest-page-subtitle">
            Verifikasi JedaIn mencakup kelayakan destinasi dan ketersediaan
            pemandu lokal. Destinasi yang belum memiliki pemandu lokal belum
            dapat memperoleh status terverifikasi.
          </p>
        </div>
      </header>

      <section
        className="dest-verification-single"
        aria-label="Status verifikasi"
      >
        <article className="dest-badge-card dest-badge-card--active">
          <div className="dest-verification-single__heading">
            <div>
              <span className="dest-verification-single__eyebrow">
                Status aktif
              </span>
              <h2>{isPlus ? "Terverifikasi Plus" : "Terverifikasi Dasar"}</h2>
            </div>
            <span className="dest-verification-single__guide-detail">
              Pemandu lokal tersedia
            </span>
          </div>

          <p className="dest-verification-single__description">
            {isPlus
              ? "Destinasi telah memenuhi standar verifikasi JedaIn dan memperoleh level Plus melalui kurasi trust lanjutan."
              : "Destinasi telah memenuhi standar dasar JedaIn, termasuk kesiapan pemandu lokal di lokasi."}
          </p>

          <div className="dest-verification-single__note">
            Pemandu lokal adalah bagian dari syarat verifikasi destinasi, bukan
            lencana terpisah.
          </div>
        </article>
      </section>
    </div>
  );
}
