import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import { generateUniqueDestinationPartnerId } from "../destination/destinationContext";
import { mockApplicationStore } from "./mockApplicationStore";
import { partnerSessionStore } from "./partnerSessionStore";
import "./eo.css";

export function PartnerLoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("destinasi@lerenghijau.id");
  const [role, setRole] = useState<"EO" | "DESTINATION">("DESTINATION");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const normalizedEmail = cleanEmail.toLowerCase();

    if (role === "DESTINATION") {
      const destApp = mockDestinationVerificationStore
        .getAll()
        .find(
          (a) =>
            a.partnerIdentityId.toLowerCase() === normalizedEmail ||
            a.applicationId.toLowerCase() === normalizedEmail ||
            a.contactEmail?.trim().toLowerCase() === normalizedEmail,
        );

      if (destApp) {
        partnerSessionStore.setPartner({
          id: destApp.partnerIdentityId,
          email: destApp.contactEmail ?? cleanEmail,
          name: destApp.name,
          role: "DESTINATION",
          businessName: destApp.managementName ?? `Pengelola ${destApp.name}`,
          destinationIdentityId: destApp.destinationIdentityId,
        });

        if (destApp.status === "APPROVED") {
          navigate("/partner/destination");
        } else {
          navigate("/partner/application");
        }
        return;
      }

      // If new/unknown destination identity: establish collision-safe prototype DESTINATION session first
      const uniquePartnerId = generateUniqueDestinationPartnerId(cleanEmail);
      partnerSessionStore.setPartner({
        id: uniquePartnerId,
        email: cleanEmail,
        name: "Mitra Destinasi Baru",
        role: "DESTINATION",
        businessName: "Pengelola Kawasan Destinasi",
      });
      navigate("/partner/apply/destination");
      return;
    }

    // EO Login flow
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

    // Default demo EO login
    partnerSessionStore.loginAsDemoApproved();
    navigate("/partner/eo");
  };

  const handleDemoApprovedEo = (
    guideStatus: "CERTIFIED_GUIDE" | "CONCEPT_ONLY",
  ) => {
    partnerSessionStore.loginAsDemoApproved(guideStatus);
    navigate("/partner/eo");
  };

  const handleDemoApprovedDestination = () => {
    partnerSessionStore.loginAsDemoDestination();
    navigate("/partner/destination");
  };

  const handleDemoPendingDestination = () => {
    partnerSessionStore.setPartner({
      id: "dest_partner_coban_rondo",
      email: "partner@cobanrondo.id",
      name: "Pengelola Hutan Pinus Coban Rondo",
      role: "DESTINATION",
      businessName: "Pengelola Coban Rondo",
      destinationIdentityId: "dest_coban_rondo",
    });
    navigate("/partner/application");
  };

  const handleDemoRejectedDestination = () => {
    partnerSessionStore.setPartner({
      id: "dest_partner_rejected",
      email: "partner@curahrawan.id",
      name: "Pengelola Curah Rawan",
      role: "DESTINATION",
      businessName: "Pengelola Lembah Curah Rawan",
      destinationIdentityId: "dest_curah_rawan",
    });
    navigate("/partner/application");
  };

  return (
    <div
      className="eo-container"
      style={{ padding: "var(--space-8) var(--space-4)", maxWidth: "580px" }}
    >
      <header style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
        <Badge tone="info">Partner Authentication</Badge>
        <h1 className="eo-page-title" style={{ marginTop: "var(--space-2)" }}>
          Masuk ke Portal Partner
        </h1>
        <p className="eo-page-subtitle">
          Pilih peran kemitraan dan kelola operasional wellness terkurasi.
        </p>
      </header>

      {/* Quick Demo Access Bar */}
      <div
        className="eo-alert eo-alert--info"
        style={{ marginBottom: "var(--space-4)" }}
      >
        <strong>Akses Cepat Evaluasi Juri:</strong>
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
            onClick={handleDemoApprovedDestination}
          >
            Destinasi Approved (Lereng Hijau)
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDemoPendingDestination}
          >
            Destinasi Pending (Coban Rondo)
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDemoRejectedDestination}
          >
            Destinasi Rejected
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleDemoApprovedEo("CERTIFIED_GUIDE")}
          >
            EO Approved Demo
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
            onChange={(e) => {
              const nextRole = e.target.value as "EO" | "DESTINATION";
              setRole(nextRole);
              setEmail(
                nextRole === "DESTINATION"
                  ? "destinasi@lerenghijau.id"
                  : "partner@jedaalam.id",
              );
            }}
          >
            <option value="DESTINATION">Pengelola Destinasi Lokal</option>
            <option value="EO">Event Organizer (EO / Tour Guide)</option>
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
            placeholder="nama@mitra.id"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          style={{ marginTop: "var(--space-2)" }}
        >
          Masuk ke Portal Partner
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
            to={
              role === "DESTINATION"
                ? "/partner/apply/destination"
                : "/partner/apply/eo"
            }
            style={{ color: "var(--color-brand-primary)", fontWeight: 600 }}
          >
            {role === "DESTINATION"
              ? "Daftar Verifikasi Destinasi"
              : "Daftar Pengajuan EO Baru"}
          </Link>
        </div>
      </form>
    </div>
  );
}
