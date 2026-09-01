import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockApplicationStore } from "./mockApplicationStore";
import { partnerSessionStore } from "./partnerSessionStore";
import "./eo.css";

export function PartnerLoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("partner@jedaalam.id");
  const [role, setRole] = useState<"EO" | "DESTINATION">("EO");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (role === "DESTINATION") {
      navigate("/partner/apply/destination");
      return;
    }

    // Check if there is an existing application or user
    const app = mockApplicationStore
      .getAll()
      .find((a) => a.email === cleanEmail);

    if (app) {
      partnerSessionStore.setPartner({
        id: app.identityId,
        email: app.email,
        name: app.contactPerson,
        role: "EO",
        businessName: app.businessName,
        guideStatus: app.guideStatus,
        organizerReviewRef:
          app.identityId === "eo_jeda_alam" ? "org_lereng_batu" : undefined,
      });

      if (app.status === "APPROVED") {
        navigate("/partner/eo");
      } else {
        navigate("/partner/application");
      }
      return;
    }

    // Default demo login
    partnerSessionStore.loginAsDemoApproved();
    navigate("/partner/eo");
  };

  const handleDemoApproved = (
    guideStatus: "CERTIFIED_GUIDE" | "CONCEPT_ONLY",
  ) => {
    partnerSessionStore.loginAsDemoApproved(guideStatus);
    navigate("/partner/eo");
  };

  const handleDemoRejected = () => {
    partnerSessionStore.setPartner({
      id: "eo_rejected_user",
      email: "rian@kelanaliar.com",
      name: "Rian Pratama",
      role: "EO",
      businessName: "Kelana Liar Adventure",
      guideStatus: "CONCEPT_ONLY",
    });
    navigate("/partner/application");
  };

  const handleDemoPending = () => {
    partnerSessionStore.setPartner({
      id: "eo_pending_user",
      email: "maya@lestariwellness.id",
      name: "Maya Safira",
      role: "EO",
      businessName: "Lestari Wellness Journey",
      guideStatus: "CERTIFIED_GUIDE",
    });
    navigate("/partner/application");
  };

  return (
    <div
      className="eo-container"
      style={{ padding: "var(--space-8) var(--space-4)", maxWidth: "560px" }}
    >
      <header style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
        <Badge tone="info">Partner Authentication</Badge>
        <h1 className="eo-page-title" style={{ marginTop: "var(--space-2)" }}>
          Masuk ke Portal Partner
        </h1>
        <p className="eo-page-subtitle">
          Kelola paket perjalanan, jadwal sesi, dan operasional wellness.
        </p>
      </header>

      {/* Quick Demo Access Bar */}
      <div
        className="eo-alert eo-alert--info"
        style={{ marginBottom: "var(--space-4)" }}
      >
        <strong>Akses Cepat Evaluasi:</strong>
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            flexWrap: "wrap",
            marginTop: "var(--space-1)",
          }}
        >
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleDemoApproved("CERTIFIED_GUIDE")}
          >
            EO Approved (Guide Certified)
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleDemoApproved("CONCEPT_ONLY")}
          >
            EO Approved (Concept-Only)
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDemoPending}
          >
            EO Pending Review
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDemoRejected}
          >
            EO Rejected
          </Button>
        </div>
      </div>

      <form
        className="eo-section"
        onSubmit={handleLogin}
        style={{ gap: "var(--space-4)" }}
      >
        <div className="eo-form-group">
          <label htmlFor="partner-role" className="eo-form-label">
            Tipe Kemitraan
          </label>
          <select
            id="partner-role"
            className="eo-form-select"
            value={role}
            onChange={(e) => setRole(e.target.value as "EO" | "DESTINATION")}
          >
            <option value="EO">Event Organizer (EO / Tour Guide)</option>
            <option value="DESTINATION">Pengelola Destinasi</option>
          </select>
        </div>

        <div className="eo-form-group">
          <label htmlFor="partner-email" className="eo-form-label">
            Email Terdaftar
          </label>
          <input
            id="partner-email"
            type="email"
            required
            className="eo-form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@organizer.id"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          style={{ marginTop: "var(--space-2)" }}
        >
          Masuk ke Portal
        </Button>

        <div
          style={{
            textAlign: "center",
            fontSize: "var(--font-size-body-sm)",
            color: "var(--color-text-secondary)",
          }}
        >
          Belum menjadi mitra?{" "}
          <Link
            to="/partner/apply/eo"
            style={{ color: "var(--color-brand-primary)", fontWeight: 600 }}
          >
            Daftar Pengajuan EO Baru
          </Link>
        </div>
      </form>
    </div>
  );
}
