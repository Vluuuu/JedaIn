import { useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { partnerSessionStore } from "./partnerSessionStore";
import "./eo.css";

export function PartnerPortalLandingScreen() {
  const navigate = useNavigate();

  const handleDemoLogin = (
    guideStatus: "CERTIFIED_GUIDE" | "CONCEPT_ONLY" = "CERTIFIED_GUIDE",
  ) => {
    partnerSessionStore.loginAsDemoApproved(guideStatus);
    navigate("/partner/eo");
  };

  return (
    <div
      className="eo-container"
      style={{ padding: "var(--space-6) var(--space-4)" }}
    >
      <header className="eo-page-header">
        <div>
          <Badge tone="success">JedaIn Partner Portal</Badge>
          <h1 className="eo-page-title" style={{ marginTop: "var(--space-2)" }}>
            Bermitra dengan JedaIn
          </h1>
          <p className="eo-page-subtitle">
            Rancang pengalaman perjalanan mindful berbasis permintaan nyata
            bersama destinasi terverifikasi.
          </p>
        </div>
      </header>

      {/* Demo Quick Entry Banner for Juror / Competition Evaluation */}
      <section className="eo-banner-card" aria-label="Akses Cepat Demo Juri">
        <div className="eo-banner-content">
          <Badge tone="warning">Simulasi Juri & Evaluasi</Badge>
          <h2>Akses Cepat Demo Workspace</h2>
          <p>
            Masuk langsung ke operational dashboard Event Organizer (EO) yang
            telah disetujui untuk mencoba seluruh alur kurasi paket, sesi
            jadwal, dan transaksi.
          </p>
        </div>
        <div
          style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}
        >
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => handleDemoLogin("CERTIFIED_GUIDE")}
          >
            Masuk sebagai EO Demo (Certified Guide)
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => handleDemoLogin("CONCEPT_ONLY")}
          >
            Masuk sebagai EO Demo (Concept-Only)
          </Button>
        </div>
      </section>

      {/* Partner Registration Cards */}
      <div className="partner-portal-card-grid">
        <article className="partner-role-card">
          <div>
            <Badge tone="info">Event Organizer</Badge>
            <h2
              style={{
                fontSize: "var(--font-size-heading-md)",
                margin: "var(--space-2) 0 var(--space-1)",
              }}
            >
              Mitra Event Organizer
            </h2>
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "var(--font-size-body-sm)",
              }}
            >
              Manfaatkan wawasan kebutuhan traveler untuk merancang retreat
              alam, mindfulness, dan workshop terkurasi.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
            }}
          >
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => navigate("/partner/apply/eo")}
            >
              Daftar sebagai EO Baru
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => navigate("/partner/login")}
            >
              Masuk Akun EO
            </Button>
          </div>
        </article>

        <article className="partner-role-card">
          <div>
            <Badge tone="neutral">Destinasi Lokal</Badge>
            <h2
              style={{
                fontSize: "var(--font-size-heading-md)",
                margin: "var(--space-2) 0 var(--space-1)",
              }}
            >
              Mitra Destinasi
            </h2>
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "var(--font-size-body-sm)",
              }}
            >
              Daftarkan lokasi alam atau ruang tenangmu untuk diverifikasi dan
              dijadikan lokasi paket wellness oleh para EO.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
            }}
          >
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => navigate("/partner/apply/destination")}
            >
              Daftar sebagai Destinasi
            </Button>
          </div>
        </article>
      </div>
    </div>
  );
}
