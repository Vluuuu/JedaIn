import { Badge } from "../../components/ui";
import { resolveAuthenticatedDestinationContext } from "./destinationContext";
import "./destination.css";

export function DestinationProfileScreen() {
  const context = resolveAuthenticatedDestinationContext();
  if (!context) {
    return (
      <div className="dest-container" style={{ padding: "var(--space-8)" }}>
        <div className="admin-alert admin-alert--warning">
          <h2>Data Profil Tidak Tersedia</h2>
          <p>
            Informasi profil destinasi tidak dapat dimuat untuk sesi saat ini.
          </p>
        </div>
      </div>
    );
  }

  const { destination } = context;

  return (
    <div className="dest-container" style={{ maxWidth: "900px" }}>
      <header className="dest-page-header">
        <div>
          <div
            style={{
              display: "flex",
              gap: "var(--space-2)",
              alignItems: "center",
              marginBottom: "var(--space-1)",
            }}
          >
            <Badge tone="success">
              Terverifikasi {destination.verificationLevel}
            </Badge>
            <Badge tone={destination.guideReady ? "success" : "neutral"}>
              {destination.guideReady ? "Guide Ready ✓" : "Tanpa Guide Lokal"}
            </Badge>
          </div>
          <h1 className="dest-page-title">Profil Kawasan Destinasi</h1>
          <p className="dest-page-subtitle">
            Informasi kanonikal kawasan alam yang terdaftar dan digunakan oleh
            EO untuk merancang paket.
          </p>
        </div>
      </header>

      {/* Critical Edit Policy Notice */}
      <div className="admin-alert admin-alert--info">
        <strong>Ketentuan Perubahan Informasi Destinasi:</strong>
        <p style={{ margin: "var(--space-1) 0 0" }}>
          Perubahan pada modal dasar, nama lokasi, atau batas kapasitas venue
          memerlukan verifikasi ulang oleh Tim Kurator Admin JedaIn demi menjaga
          integritas paket yang sedang aktif.
        </p>
      </div>

      <section className="eo-section" aria-label="Informasi utama destinasi">
        <h2 className="eo-section-title">Informasi Kawasan Alam</h2>

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
              Nama Destinasi:
            </small>
            <strong style={{ fontSize: "var(--font-size-body-md)" }}>
              {destination.name}
            </strong>
          </div>

          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Wilayah & Lokasi:
            </small>
            <strong style={{ fontSize: "var(--font-size-body-md)" }}>
              {destination.locationLabel}
            </strong>
          </div>

          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Modal Dasar per Orang:
            </small>
            <strong
              style={{
                fontSize: "var(--font-size-body-md)",
                color: "var(--color-brand-primary)",
              }}
            >
              Rp{destination.baseCostPerPerson.toLocaleString("id-ID")}
            </strong>
          </div>

          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Batas Kapasitas per Sesi:
            </small>
            <strong style={{ fontSize: "var(--font-size-body-md)" }}>
              {destination.capacityPerSession} Orang / sesi
            </strong>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--color-border-default)",
            paddingTop: "var(--space-3)",
          }}
        >
          <small style={{ color: "var(--color-text-muted)", display: "block" }}>
            Deskripsi Ketenangan Kawasan:
          </small>
          <p
            style={{
              margin: "var(--space-1) 0 0",
              fontSize: "var(--font-size-body-sm)",
              color: "var(--color-text-primary)",
            }}
          >
            {destination.description}
          </p>
        </div>

        {destination.highlights && destination.highlights.length > 0 && (
          <div
            style={{
              borderTop: "1px solid var(--color-border-default)",
              paddingTop: "var(--space-3)",
            }}
          >
            <small
              style={{
                color: "var(--color-text-muted)",
                display: "block",
                marginBottom: "var(--space-1)",
              }}
            >
              Fasilitas & Daya Tarik Kunci:
            </small>
            <ul
              style={{
                margin: 0,
                paddingLeft: "1.25rem",
                color: "var(--color-text-secondary)",
                fontSize: "var(--font-size-body-sm)",
              }}
            >
              {destination.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
