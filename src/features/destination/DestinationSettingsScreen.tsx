import { Badge } from "../../components/ui";
import { resolveAuthenticatedDestinationContext } from "./destinationContext";
import "./destination.css";

export function DestinationSettingsScreen() {
  const context = resolveAuthenticatedDestinationContext();
  if (!context) {
    return (
      <div className="dest-container" style={{ padding: "var(--space-8)" }}>
        <div className="admin-alert admin-alert--warning">
          <h2>Pengaturan Tidak Tersedia</h2>
          <p>Informasi pengaturan akun destinasi tidak dapat dimuat.</p>
        </div>
      </div>
    );
  }

  const { destination, partner } = context;

  return (
    <div className="dest-container" style={{ maxWidth: "800px" }}>
      <header className="dest-page-header">
        <div>
          <Badge tone="info">Pengaturan Akun & Kemitraan</Badge>
          <h1
            className="dest-page-title"
            style={{ marginTop: "var(--space-2)" }}
          >
            Profil Kemitraan Destinasi
          </h1>
          <p className="dest-page-subtitle">
            Informasi entitas pengelola, penanggung jawab operasional, dan
            status relasi kemitraan JedaIn.
          </p>
        </div>
      </header>

      <section className="eo-section">
        <h2 className="eo-section-title">Informasi Pengelola & Kontak</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-4)",
            fontSize: "var(--font-size-body-sm)",
          }}
        >
          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Nama Entitas Pengelola:
            </small>
            <strong style={{ fontSize: "var(--font-size-body-md)" }}>
              {partner.businessName ?? "Pengelola Kawasan"}
            </strong>
          </div>

          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Penanggung Jawab:
            </small>
            <strong style={{ fontSize: "var(--font-size-body-md)" }}>
              {partner.name}
            </strong>
          </div>

          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Email Operasional:
            </small>
            <strong style={{ fontSize: "var(--font-size-body-md)" }}>
              {partner.email}
            </strong>
          </div>

          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Kawasan Destinasi Terkait:
            </small>
            <Badge tone="success">
              {destination.name} ({destination.verificationLevel})
            </Badge>
          </div>
        </div>
      </section>

      <section className="eo-section">
        <h2 className="eo-section-title">Kepatuhan Standar SOP JedaIn</h2>
        <div className="admin-alert admin-alert--success">
          <strong>Perjanjian Kemitraan Destinasi Aktif</strong>
          <p style={{ margin: "var(--space-1) 0 0" }}>
            Pengelola kawasan menyatakan tunduk pada standar kurasi mindful
            travel, menjaga ketenangan lingkungan dari polusi suara berlebih,
            dan keterbukaan modal dasar per peserta.
          </p>
        </div>
      </section>
    </div>
  );
}
