import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockApplicationStore } from "./mockApplicationStore";
import { partnerSessionStore } from "./partnerSessionStore";
import "./eoLogin.css";

export function EoLoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath =
    (location.state as { from?: string } | null)?.from || "/partner/eo";

  const [email, setEmail] = useState("partner@jedaalam.id");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleRealLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(undefined);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage("Email bisnis wajib diisi.");
      return;
    }

    if (!password) {
      setErrorMessage("Kata sandi wajib diisi.");
      return;
    }

    const app = mockApplicationStore
      .getAll()
      .find((a) => a.email.toLowerCase() === cleanEmail);

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
        navigate(fromPath);
      } else {
        navigate("/partner/application");
      }
      return;
    }

    // Default fallback to approved EO session for test accounts
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    navigate(fromPath);
  };

  const handleDemoLogin = () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    navigate("/partner/eo");
  };

  return (
    <div className="eo-login-layout">
      <main className="eo-login-card" aria-label="Halaman Masuk EO Workspace">
        {/* Brand & Context Header */}
        <header className="eo-login-header">
          <div className="eo-login-brand">
            <span className="eo-login-brand__badge">
              <Badge tone="success">EO Workspace</Badge>
            </span>
          </div>

          <h1 className="eo-login-title">Masuk sebagai Event Organizer</h1>
          <p className="eo-login-subtitle">
            Kelola experience JedaIn dan jadwal perjalanan mindful retreat
            bersama destinasi terverifikasi.
          </p>
        </header>

        {/* Notice for Forgot Password */}
        {forgotPasswordNotice && (
          <div className="eo-login-notice" role="status">
            <p>
              Instruksi pemulihan kata sandi telah dikirim ke email terdaftar
              (mode prototype).
            </p>
            <button
              type="button"
              className="eo-login-notice__close"
              onClick={() => setForgotPasswordNotice(false)}
              aria-label="Tutup pemberitahuan"
            >
              ×
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="eo-login-alert" role="alert">
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Real Login Form */}
        <form onSubmit={handleRealLogin} className="eo-login-form">
          <div className="eo-login-field">
            <label htmlFor="eo-login-email" className="eo-login-label">
              Email Bisnis EO
            </label>
            <input
              id="eo-login-email"
              type="email"
              required
              autoComplete="email"
              className="eo-login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@organizer.id"
            />
          </div>

          <div className="eo-login-field">
            <div className="eo-login-label-row">
              <label htmlFor="eo-login-password" className="eo-login-label">
                Kata Sandi
              </label>
              <button
                type="button"
                className="eo-login-forgot-btn"
                onClick={() => setForgotPasswordNotice(true)}
              >
                Lupa kata sandi?
              </button>
            </div>
            <div className="eo-login-password-wrap">
              <input
                id="eo-login-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="eo-login-input eo-login-input--password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
              />
              <button
                type="button"
                className="eo-login-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={
                  showPassword
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
              >
                {showPassword ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
          </div>

          <div className="eo-login-options">
            <label className="eo-login-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="eo-login-remember__checkbox"
              />
              <span>Ingat saya di perangkat ini</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="eo-login-submit-btn"
          >
            Masuk ke EO Workspace
          </Button>
        </form>

        {/* Divider */}
        <div className="eo-login-divider">
          <span className="eo-login-divider__line" />
          <span className="eo-login-divider__text">
            atau coba workspace demo
          </span>
          <span className="eo-login-divider__line" />
        </div>

        {/* Demo EO Workspace Access Card */}
        <section
          className="eo-login-demo-card"
          aria-label="Evaluasi Akun Demo EO"
        >
          <div className="eo-login-demo-card__header">
            <div>
              <span className="eo-login-demo-card__badge">
                Akun Terverifikasi
              </span>
              <h2 className="eo-login-demo-card__name">Jeda Alam Nusantara</h2>
            </div>
            <span
              className="eo-login-demo-card__seal"
              title="Pemandu Bersertifikat BNSP"
            >
              BNSP Certified
            </span>
          </div>
          <p className="eo-login-demo-card__desc">
            Akses demo terdaftar dengan paket terkurasi, jadwal sesi aktif, dan
            analisis sinyal kebutuhan traveler.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="eo-login-demo-btn"
            onClick={handleDemoLogin}
          >
            Masuk sebagai EO Demo
          </Button>
        </section>
      </main>
    </div>
  );
}
