import { useState } from "react";
import { useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { adminSessionStore } from "./adminSessionStore";
import "./admin.css";

export function AdminLoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@jedain.id");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    adminSessionStore.loginAsDemoAdmin();
    navigate("/admin");
  };

  const handleDemoQuickLogin = () => {
    adminSessionStore.loginAsDemoAdmin();
    navigate("/admin");
  };

  return (
    <div
      className="admin-container"
      style={{ padding: "var(--space-8) var(--space-4)", maxWidth: "520px" }}
    >
      <header style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
        <Badge tone="info">Internal Trust Operations</Badge>
        <h1
          className="admin-page-title"
          style={{ marginTop: "var(--space-2)" }}
        >
          Masuk ke Admin Console
        </h1>
        <p className="admin-page-subtitle">
          Pusat kurasi mitra, verifikasi destinasi, dan tata kelola mindful
          travel JedaIn.
        </p>
      </header>

      {/* Quick Demo Access Bar */}
      <div
        className="admin-alert admin-alert--info"
        style={{ marginBottom: "var(--space-4)" }}
      >
        <strong>Akses Evaluasi Juri:</strong>
        <p
          style={{
            margin: "var(--space-1) 0 var(--space-2)",
            fontSize: "var(--font-size-caption)",
          }}
        >
          Masuk langsung sebagai Administrator Tim Kurasi JedaIn.
        </p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleDemoQuickLogin}
        >
          Masuk sebagai Admin Demo
        </Button>
      </div>

      <form
        className="admin-section"
        onSubmit={handleLogin}
        style={{ gap: "var(--space-4)" }}
      >
        <div>
          <label
            htmlFor="admin-email"
            style={{
              display: "block",
              fontSize: "var(--font-size-label-md)",
              fontWeight: 600,
              marginBottom: "var(--space-2)",
            }}
          >
            Email Administrator
          </label>
          <input
            id="admin-email"
            type="email"
            required
            className="eo-form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@jedain.id"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          style={{ marginTop: "var(--space-2)" }}
        >
          Masuk ke Dashboard Admin
        </Button>
      </form>
    </div>
  );
}
