import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import JedaInLogo from "../../JedaIn_logo_vector.svg";
import { Button } from "../../components/ui";
import { ensureDemoEoSession } from "../../lib/supabase/demoAuth";
import { isSupabaseMode } from "../../lib/supabase/config";
import { LOGIN_ATMOSPHERE_VISUAL } from "../../lib/assets/packageImages";
import { mockApplicationStore } from "./mockApplicationStore";
import { partnerSessionStore } from "./partnerSessionStore";
import "./eoLogin.css";

export function EoLoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath =
    (location.state as { from?: string } | null)?.from || "/partner/eo";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRealLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(undefined);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage("Email bisnis wajib diisi.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Kata sandi wajib diisi.");
      return;
    }

    if (isSupabaseMode()) {
      setIsSubmitting(true);
      const res = await ensureDemoEoSession();
      setIsSubmitting(false);
      if (!res.success) {
        setErrorMessage(
          res.error || "Gagal menghubungkan sesi Supabase untuk TO.",
        );
        return;
      }
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

    setErrorMessage(
      "Email bisnis atau kata sandi belum terdaftar sebagai TO aktif.",
    );
  };

  const handleDemoLogin = async () => {
    setErrorMessage(undefined);
    setIsSubmitting(true);
    try {
      const res = await ensureDemoEoSession();
      if (!res.success) {
        setErrorMessage(
          res.error || "Gagal menghubungkan sesi demo TO ke Supabase.",
        );
        setIsSubmitting(false);
        return;
      }
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      navigate("/partner/eo");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal masuk demo TO.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="eo-login-layout">
      <div className="eo-login-container">
        {/* Area Kiri: Visual Identity JedaIn yang Tenang */}
        <section
          className="eo-login-hero"
          aria-label="Identitas Travel Organizer JedaIn"
        >
          <div className="eo-login-hero__brand">
            <img
              src={JedaInLogo}
              alt="JedaIn"
              className="eo-login-hero__logo"
              width="1407"
              height="768"
            />
            <span className="eo-login-hero__role">Travel Organizer</span>
          </div>

          <div className="eo-login-hero__visual">
            <img
              src={LOGIN_ATMOSPHERE_VISUAL.svgDataUri}
              alt="Suasana alam JedaIn"
              className="eo-login-hero__img"
            />
          </div>

          <div className="eo-login-hero__copy">
            <h2 className="eo-login-hero__title">
              Kelola perjalanan JedaIn bersama timmu.
            </h2>
            <p className="eo-login-hero__desc">
              Masuk untuk merancang paket experience, mengelola jadwal sesi, dan
              memantau operasional perjalanan bersama mitra destinasi.
            </p>
          </div>
        </section>

        {/* Area Kanan: Login Form */}
        <section
          className="eo-login-panel"
          aria-label="Form Masuk Travel Organizer"
        >
          {/* Mobile-only brand header */}
          <div className="eo-login-mobile-brand">
            <img
              src={JedaInLogo}
              alt="JedaIn"
              className="eo-login-mobile-brand__logo"
              width="1407"
              height="768"
            />
            <span className="eo-login-mobile-brand__tag">Travel Organizer</span>
          </div>

          <div className="eo-login-panel__header">
            <h1 className="eo-login-panel__title">Masuk ke JedaIn</h1>
            <p className="eo-login-panel__subtitle">
              Gunakan akun Travel Organizer yang terdaftar.
            </p>
          </div>

          {/* Inline Notices */}
          {forgotPasswordNotice && (
            <div className="eo-login-notice" role="status">
              <p>
                Instruksi pemulihan kata sandi telah dikirim ke email terdaftar.
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

          {errorMessage && (
            <div className="eo-login-alert" role="alert">
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRealLogin} className="eo-login-form">
            <div className="eo-login-field">
              <label htmlFor="eo-login-email" className="eo-login-label">
                Email bisnis
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
              <label htmlFor="eo-login-password" className="eo-login-label">
                Kata sandi
              </label>
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
                <span>Ingat saya</span>
              </label>
              <button
                type="button"
                className="eo-login-forgot-btn"
                onClick={() => setForgotPasswordNotice(true)}
              >
                Lupa kata sandi?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="eo-login-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          {/* Separator */}
          <div className="eo-login-separator">
            <span className="eo-login-separator__line" />
            <span className="eo-login-separator__text">atau</span>
            <span className="eo-login-separator__line" />
          </div>

          {/* Demo Access */}
          <div className="eo-login-demo">
            <p className="eo-login-demo__hint">
              Ingin melihat dashboard terlebih dahulu?
            </p>
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="eo-login-demo__btn"
              onClick={handleDemoLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Memproses..." : "Coba akun demo"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
