import { InlineStatus } from "../../components/ui";
import { resolveAuthenticatedDestinationContext } from "./destinationContext";
import "./destination.css";

export function DestinationVerificationBadgeScreen() {
  const context = resolveAuthenticatedDestinationContext();
  if (!context) {
    return (
      <div className="dest-container" style={{ padding: "var(--space-8)" }}>
        <div className="admin-alert admin-alert--warning">
          <h2>Status Destinasi Tidak Tersedia</h2>
          <p className="sr-only">Status Verifikasi Tidak Tersedia</p>
          <p>Informasi status destinasi tidak tersedia untuk akun ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dest-container" style={{ maxWidth: "760px" }}>
      <header className="dest-page-header">
        <div>
          <h1 className="dest-page-title">Status Destinasi</h1>
          <p className="dest-page-subtitle">
            Destinasi Anda telah disetujui dan dapat digunakan EO untuk
            merancang experience.
          </p>
        </div>
      </header>

      <section
        className="dest-verification-single"
        aria-label="Status destinasi"
      >
        <article className="dest-badge-card dest-badge-card--active">
          <div className="dest-verification-single__heading">
            <div>
              <span className="dest-verification-single__eyebrow">
                Status aktif
              </span>
              <h2>Aktif sebagai Mitra Destinasi JedaIn</h2>
            </div>
            <span className="dest-verification-single__app-status">
              Status pengajuan ·{" "}
              <InlineStatus tone="success">Disetujui</InlineStatus>
            </span>
          </div>

          <p className="dest-verification-single__description">
            Destinasi Anda telah disetujui dan dapat digunakan EO untuk
            merancang experience.
          </p>
        </article>
      </section>
    </div>
  );
}
