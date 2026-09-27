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
          <p>Informasi verifikasi destinasi tidak tersedia untuk akun ini.</p>
        </div>
      </div>
    );
  }

  const { destination } = context;
  const verificationLabel =
    destination.verificationLevel === "PLUS"
      ? "Terverifikasi Plus"
      : "Terverifikasi Dasar";

  return (
    <div className="dest-container" style={{ maxWidth: "960px" }}>
      <header className="dest-page-header">
        <div>
          <h1 className="dest-page-title">Status Verifikasi Destinasi</h1>
          <p className="dest-page-subtitle">
            Destinasi yang terverifikasi JedaIn wajib memiliki pemandu lokal
            yang siap mendampingi perjalanan di lokasi.
          </p>
        </div>
      </header>

      <section
        className="dest-verification-summary"
        aria-labelledby="destination-verification-title"
      >
        <div className="dest-verification-summary__header">
          <div>
            <span className="dest-verification-summary__eyebrow">
              Status saat ini
            </span>
            <h2 id="destination-verification-title">{verificationLabel}</h2>
          </div>
          <Badge
            tone={destination.verificationLevel === "PLUS" ? "info" : "success"}
            showSymbol={false}
          >
            Aktif
          </Badge>
        </div>

        <div className="dest-verification-summary__facts">
          <div>
            <strong>Pemandu lokal tersedia</strong>
            <span>
              Kesiapan pemandu merupakan bagian dari syarat verifikasi
              destinasi, bukan lencana terpisah.
            </span>
          </div>
          <div>
            <strong>Kurasi Admin JedaIn</strong>
            <span>
              BASIC adalah verifikasi awal. PLUS dapat diberikan melalui
              evaluasi trust lifecycle lanjutan.
            </span>
          </div>
        </div>

        {!destination.guideReady && (
          <div className="admin-alert admin-alert--error">
            <strong>Data perlu ditinjau ulang.</strong>
            <p>
              Destinasi aktif terverifikasi tidak boleh berstatus tanpa
              pemandu lokal.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
