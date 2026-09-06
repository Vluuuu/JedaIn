import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import JedaInLogo from "../../JedaIn_logo_vector.svg";
import { Button } from "../../components/ui";
import { LOGIN_ATMOSPHERE_VISUAL } from "../../lib/assets/packageImages";
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

    if (!password.trim()) {
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

    setErrorMessage(
      "Email bisnis atau kata sandi belum terdaftar sebagai EO aktif.",
    );
  };

  const handleDemoLogin = () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    navigate("/partner/eo");
  };

  // prettier-ignore
  return (
    <div className="eo-login-page">
      <header className="eo-login-topbar">
        <a
          href="https://jedain.biz.id"
          className="eo-login-topbar__brand"
          aria-label="JedaIn"
        >
          <img
            src={JedaInLogo}
            alt="JedaIn"
            className="eo-login-topbar__logo"
            width="1407"
            height="768"
          />
        </a>
        <span className="eo-login-topbar__surface">
          Portal Event Organizer
        </span>
      </header>

      <div className="eo-login-layout">
        <section
          className="eo-login-intro"
          aria-labelledby="eo-login-intro-title"
        >
          <img
            src={LOGIN_ATMOSPHERE_VISUAL.svgDataUri}
            alt=""
            aria-hidden="true"
            className="eo-login-intro__image"
          />
          <div className="eo-login-intro__scrim" aria-hidden="true" />

          <div className="eo-login-intro__content">
            <p className="eo-login-intro__kicker">Untuk Event Organizer</p>
            <h1 id="eo-login-intro-title">
              Kelola paket dan perjalanan JedaIn dari satu tempat.
            </h1>
            <p className="eo-login-intro__lead">
              Lihat kebutuhan traveler, susun paket, buka jadwal, dan pantau
              booking dari dashboard EO.
            </p>

            <div
              className="eo-login-intro__features"
              aria-label="Fitur utama EO"
            >
              <div>
                <strong>Insight traveler</strong>
                <span>
                  Lihat pola kebutuhan yang bisa dikembangkan menjadi paket.
                </span>
              </div>
              <div>
                <strong>Paket & jadwal</strong>
                <span>Susun experience dan atur sesi keberangkatan.</span>
              </div>
              <div>
                <strong>Booking</strong>
                <span>
                  Pantau peserta dan aktivitas perjalanan yang berjalan.
                </span>
              </div>
            </div>
          </div>
        </section>

        <main className="eo-login-auth" aria-label="Masuk Event Organizer">
          <div className="eo-login-auth__inner">
            <header className="eo-login-auth__header">
              <p className="eo-login-auth__eyebrow">Event Organizer</p>
              <h2>Masuk ke akun EO</h2>
              <p>Gunakan email bisnis yang terdaftar di JedaIn.</p>
            </header>

            {forgotPasswordNotice && (
              <div className="eo-login-notice" role="status">
                <p>
                  Instruksi pemulihan kata sandi telah dikirim ke email
                  terdaftar.
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
                <div className="eo-login-label-row">
                  <label
                    htmlFor="eo-login-password"
                    className="eo-login-label"
                  >
                    Kata sandi
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

              <label className="eo-login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="eo-login-remember__checkbox"
                />
                <span>Ingat saya</span>
              </label>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="eo-login-submit-btn"
              >
                Masuk
              </Button>
            </form>

            <div className="eo-login-divider" aria-hidden="true">
              <span />
              <span>Demo</span>
              <span />
            </div>

            <section className="eo-login-demo" aria-label="Akses demo EO">
              <div>
                <h3>Lihat dashboard dengan data contoh</h3>
                <p>
                  Buka akun Jeda Alam Nusantara untuk mencoba alur EO tanpa
                  mengisi kredensial.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="eo-login-demo-btn"
                onClick={handleDemoLogin}
              >
                Buka akun demo
              </Button>
            </section>

            <p className="eo-login-auth__footnote">
              Portal ini khusus untuk Event Organizer yang terdaftar di JedaIn.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
