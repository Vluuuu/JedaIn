import { Badge } from "../../components/ui";
import { mockApplicationStore } from "./mockApplicationStore";
import { partnerSessionStore } from "./partnerSessionStore";
import "./eo.css";

export function EoProfileScreen() {
  const partner = partnerSessionStore.get();
  const application = partner
    ? mockApplicationStore.getBySellerId(partner.id)
    : undefined;

  return (
    <div className="eo-container" style={{ maxWidth: "800px" }}>
      <header className="eo-page-header">
        <div>
          <Badge tone="success">Identitas Terverifikasi</Badge>
          <h1 className="eo-page-title" style={{ marginTop: "var(--space-2)" }}>
            Profil Mitra Event Organizer
          </h1>
          <p className="eo-page-subtitle">
            Informasi entitas bisnis, status pemandu, dan detail operasional
            kemitraan.
          </p>
        </div>
      </header>

      <section className="eo-section">
        <h2 className="eo-section-title">Informasi Profil EO</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-4)",
          }}
        >
          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Nama Usaha / Komunitas:
            </small>
            <strong style={{ fontSize: "var(--font-size-body-md)" }}>
              {partner?.businessName ?? "Jeda Alam Nusantara"}
            </strong>
          </div>

          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Penanggung Jawab:
            </small>
            <strong style={{ fontSize: "var(--font-size-body-md)" }}>
              {partner?.name ?? "Budi Santoso"}
            </strong>
          </div>

          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Email Kontak:
            </small>
            <strong style={{ fontSize: "var(--font-size-body-md)" }}>
              {partner?.email ?? "partner@jedaalam.id"}
            </strong>
          </div>

          <div>
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Status Kategori Pemandu:
            </small>
            <Badge
              tone={
                partner?.guideStatus === "CERTIFIED_GUIDE"
                  ? "success"
                  : "neutral"
              }
            >
              {partner?.guideStatus === "CERTIFIED_GUIDE"
                ? "Certified Guide (Lisensi Resmi)"
                : "Concept-Only (Guide Ready Required)"}
            </Badge>
          </div>
        </div>

        {application?.experienceDescription && (
          <div
            style={{
              borderTop: "1px solid var(--color-border-default)",
              paddingTop: "var(--space-3)",
            }}
          >
            <small
              style={{ color: "var(--color-text-muted)", display: "block" }}
            >
              Deskripsi Pengalaman & Filosofi:
            </small>
            <p
              style={{
                margin: "var(--space-1) 0 0",
                fontSize: "var(--font-size-body-sm)",
                color: "var(--color-text-secondary)",
              }}
            >
              {application.experienceDescription}
            </p>
          </div>
        )}
      </section>

      <section className="eo-section">
        <h2 className="eo-section-title">Status Kepatuhan & SOP</h2>
        <div className="eo-alert eo-alert--success">
          <strong>Perjanjian Standar Operasional JedaIn Aktif</strong>
          <p style={{ margin: "var(--space-1) 0 0" }}>
            Mitra menyatakan tunduk pada pedoman mindful travel, transparansi
            rincian biaya destinasi, dan SOP keselamatan peserta perjalanan.
          </p>
        </div>
      </section>
    </div>
  );
}
