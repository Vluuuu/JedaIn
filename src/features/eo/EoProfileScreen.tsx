import { Link } from "react-router";
import { InlineStatus } from "../../components/ui";
import PlanMascot from "../../assets/mascot/plan.png";
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
          <h1 className="eo-page-title">Pengaturan Travel Organizer</h1>
          <p className="eo-page-subtitle">
            Kelola sesi perjalanan dan lihat informasi kemitraanmu.
          </p>
        </div>
      </header>

      <section
        className="partner-settings__section"
        aria-labelledby="eo-operation-title"
      >
        <div>
          <span className="partner-settings__index">01 / Operasional</span>
          <h2 id="eo-operation-title">Pengaturan sesi perjalanan</h2>
          <p>
            Atur jam keberangkatan, estimasi selesai, kapasitas peserta, dan
            catatan operasional pada setiap sesi. Kapasitas sesi milik Travel
            Organizer terpisah dari kapasitas umum destinasi.
          </p>
          <Link className="partner-settings__link" to="/partner/eo/sessions">
            Kelola jadwal & kapasitas sesi ↗
          </Link>
        </div>
        <div className="partner-settings__mascot-art" aria-hidden="true">
          <span>Ruang untuk merencanakan jeda.</span>
          <img src={PlanMascot} alt="" />
        </div>
      </section>

      <section className="eo-section">
        <h2 className="eo-section-title">Informasi Profil Travel Organizer</h2>

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
              Kapabilitas Pemanduan EO:
            </small>
            <InlineStatus
              tone={
                partner?.guideStatus === "CERTIFIED_GUIDE"
                  ? "success"
                  : "neutral"
              }
            >
              {partner?.guideStatus === "CERTIFIED_GUIDE"
                ? "Memiliki sertifikasi pemanduan"
                : "Tidak menggunakan sertifikasi pemanduan EO"}
            </InlineStatus>
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
