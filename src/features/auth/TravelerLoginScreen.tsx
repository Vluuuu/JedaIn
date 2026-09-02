import { useState } from "react";
import { Link, useNavigate } from "react-router";
import JedaInLogo from "../../JedaIn_logo_vector.svg";
import { Button, Dialog } from "../../components/ui";
import { LOGIN_ATMOSPHERE_VISUAL } from "../../lib/assets/packageImages";
import { env } from "../../lib/config/env";
import { sessionStore } from "../onboarding/sessionStore";
import { AuthMethodDivider } from "./AuthMethodDivider";
import { EmailAuthForm } from "./EmailAuthForm";
import { GoogleIcon } from "./GoogleIcon";
import { defaultAuthAdapter } from "./mockAdapter";
import { PhoneOtpForm } from "./PhoneOtpForm";
import { getAuthRedirectPath } from "./routing";
import {
  AuthError,
  type AuthAdapter,
  type AuthMethod,
  type AuthState,
  type AuthUser,
  type PhoneOtpSession,
} from "./types";
import "./auth.css";

export interface TravelerLoginScreenProps {
  adapter?: AuthAdapter;
  onSuccess?: (user: AuthUser, redirectPath: string) => void;
  enableEmailAuth?: boolean;
}

export function TravelerLoginScreen({
  adapter = defaultAuthAdapter,
  onSuccess,
  enableEmailAuth = env.enableEmailAuth,
}: TravelerLoginScreenProps) {
  const navigate = useNavigate();

  const [tabMode, setTabMode] = useState<"SIGN_IN" | "SIGN_UP">("SIGN_IN");
  const [authState, setAuthState] = useState<AuthState>("IDLE");
  const [activeMethod, setActiveMethod] = useState<AuthMethod>(null);

  // Method-scoped errors
  const [googleError, setGoogleError] = useState<string | undefined>();
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();

  // Form states preserved across recoverable errors
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otpSession, setOtpSession] = useState<PhoneOtpSession | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // Legal dialog modal states
  const [legalModal, setLegalModal] = useState<"terms" | "privacy" | null>(
    null,
  );

  const isAnyLoading = activeMethod !== null;

  const handleAuthSuccess = (user: AuthUser) => {
    sessionStore.setUser(user);
    setActiveMethod(null);
    const redirectPath = getAuthRedirectPath({
      isNewUser: user.isNewUser,
      onboardingStatus: user.onboardingStatus,
    });

    if (onSuccess) {
      onSuccess(user, redirectPath);
    } else {
      navigate(redirectPath);
    }
  };

  const handleGoogleLogin = async () => {
    if (isAnyLoading) return;
    setGoogleError(undefined);
    setActiveMethod("GOOGLE");
    setAuthState("AUTHENTICATING");

    try {
      const user = await adapter.loginWithGoogle();
      setActiveMethod(null);
      setAuthState("IDLE");
      handleAuthSuccess(user);
    } catch (err: unknown) {
      setActiveMethod(null);
      if (err instanceof AuthError && err.code === "CANCELLED") {
        setAuthState("IDLE");
      } else {
        setAuthState("ERROR");
        setGoogleError(
          err instanceof Error ? err.message : "Gagal masuk dengan Google.",
        );
      }
    }
  };

  const handleRequestPhoneOtp = async (inputPhone: string) => {
    if (isAnyLoading) return;
    setPhoneError(undefined);
    setPhone(inputPhone);
    setActiveMethod("PHONE_REQUEST");
    setAuthState("AUTHENTICATING");

    try {
      const session = await adapter.requestPhoneOtp(inputPhone);
      setOtpSession(session);
      setActiveMethod(null);
      setAuthState("OTP_SENT");
    } catch (err: unknown) {
      setActiveMethod(null);
      setAuthState("ERROR");
      setPhoneError(
        err instanceof Error ? err.message : "Gagal mengirim kode OTP.",
      );
    }
  };

  const handleVerifyPhoneOtp = async (code: string) => {
    if (isAnyLoading || !otpSession) return;
    setPhoneError(undefined);
    setActiveMethod("PHONE_VERIFY");
    setAuthState("OTP_VERIFYING");

    try {
      const user = await adapter.verifyPhoneOtp({
        phone: otpSession.phone,
        verificationId: otpSession.verificationId,
        code,
      });
      setActiveMethod(null);
      setAuthState("IDLE");
      handleAuthSuccess(user);
    } catch (err: unknown) {
      setActiveMethod(null);
      setAuthState("ERROR");
      setPhoneError(
        err instanceof Error ? err.message : "Kode OTP tidak valid.",
      );
    }
  };

  const handleResetToPhone = () => {
    setOtpSession(null);
    setPhoneError(undefined);
    if (authState === "OTP_SENT" || authState === "OTP_VERIFYING") {
      setAuthState("IDLE");
    }
  };

  const handleRequestEmailLink = async (inputEmail: string) => {
    if (isAnyLoading || !adapter.requestEmailLink) return;
    setEmailError(undefined);
    setEmail(inputEmail);
    setActiveMethod("EMAIL");
    setAuthState("AUTHENTICATING");

    try {
      await adapter.requestEmailLink(inputEmail);
      setEmailSent(true);
      setActiveMethod(null);
      setAuthState("IDLE");
    } catch (err: unknown) {
      setActiveMethod(null);
      setAuthState("ERROR");
      setEmailError(
        err instanceof Error ? err.message : "Gagal mengirim email.",
      );
    }
  };

  return (
    <div className="auth-screen">
      {/* Immersive Nature / Landscape Background Layer */}
      <div className="auth-screen__backdrop" aria-hidden="true">
        <img
          src={LOGIN_ATMOSPHERE_VISUAL.svgDataUri}
          alt=""
          className="auth-screen__backdrop-image"
          loading="eager"
          width="1000"
          height="800"
        />
        <div className="auth-screen__backdrop-scrim" />
        <div className="auth-screen__backdrop-grain" />
      </div>

      {/* Floating Centered Card Container */}
      <div className="auth-screen__container">
        {/* Top Floating Return Action */}
        <header className="auth-screen__topbar">
          <Link
            to="/"
            className="auth-back-action"
            aria-label="Kembali ke halaman awal"
          >
            <svg
              viewBox="0 0 20 20"
              width="18"
              height="18"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12.5 15L7.5 10L12.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Kembali ke Beranda</span>
          </Link>
        </header>

        {/* The Centered Floating Auth Card */}
        <main className="auth-card" aria-labelledby="auth-card-title">
          {/* Brand Logo inside Card Header */}
          <div className="auth-card__brand">
            <Link to="/" aria-label="JedaIn">
              <img
                src={JedaInLogo}
                alt="JedaIn"
                className="auth-card__logo"
                width="1407"
                height="768"
                loading="eager"
              />
            </Link>
            <span className="auth-card__tagline">
              Travel &amp; Mindful Living
            </span>
          </div>

          {/* Segmented Top Switch / Auth Tabs: SIGN IN vs SIGN UP */}
          <div
            className="auth-tabs"
            role="tablist"
            aria-label="Metode autentikasi"
          >
            <button
              type="button"
              role="tab"
              id="tab-sign-in"
              aria-selected={tabMode === "SIGN_IN"}
              aria-controls="auth-panel"
              className={`auth-tab ${tabMode === "SIGN_IN" ? "auth-tab--active" : ""}`}
              onClick={() => {
                setTabMode("SIGN_IN");
                setGoogleError(undefined);
              }}
            >
              SIGN IN
            </button>
            <button
              type="button"
              role="tab"
              id="tab-sign-up"
              aria-selected={tabMode === "SIGN_UP"}
              aria-controls="auth-panel"
              className={`auth-tab ${tabMode === "SIGN_UP" ? "auth-tab--active" : ""}`}
              onClick={() => {
                setTabMode("SIGN_UP");
                setGoogleError(undefined);
              }}
            >
              SIGN UP
            </button>
          </div>

          {/* Card Content / Form Area */}
          <div
            id="auth-panel"
            role="tabpanel"
            aria-labelledby={
              tabMode === "SIGN_IN" ? "tab-sign-in" : "tab-sign-up"
            }
            className="auth-card__content"
          >
            <header className="auth-header">
              <h1 id="auth-card-title">
                {tabMode === "SIGN_IN" ? "Masuk ke JedaIn" : "Daftar JedaIn"}
              </h1>
              <p>
                {tabMode === "SIGN_IN"
                  ? "Masuk atau daftar untuk menemukan experience yang lebih personal."
                  : "Mulai perjalanan mindful travel dan temukan ritme jedamu."}
              </p>
            </header>

            {googleError && (
              <div className="auth-error-banner" role="alert">
                <p>{googleError}</p>
              </div>
            )}

            <div className="auth-actions">
              {/* Primary Auth Method: Phone OTP Form */}
              <PhoneOtpForm
                phone={phone}
                onPhoneChange={(val) => {
                  setPhone(val);
                  if (phoneError) setPhoneError(undefined);
                }}
                onRequestOtp={handleRequestPhoneOtp}
                onVerifyOtp={handleVerifyPhoneOtp}
                onResetToPhone={handleResetToPhone}
                isOtpSent={
                  Boolean(otpSession) ||
                  authState === "OTP_SENT" ||
                  authState === "OTP_VERIFYING"
                }
                isSubmitting={
                  activeMethod === "PHONE_REQUEST" ||
                  activeMethod === "PHONE_VERIFY"
                }
                isDisabled={isAnyLoading}
                error={phoneError}
              />

              {/* Optional Email Auth */}
              {enableEmailAuth && (
                <>
                  <AuthMethodDivider label="atau dengan email" />
                  <EmailAuthForm
                    email={email}
                    onEmailChange={(val) => {
                      setEmail(val);
                      if (emailError) setEmailError(undefined);
                    }}
                    onRequestEmailLink={handleRequestEmailLink}
                    isSubmitting={activeMethod === "EMAIL"}
                    isDisabled={isAnyLoading}
                    isSent={emailSent}
                    error={emailError}
                  />
                </>
              )}

              {/* Divider for Social Auth */}
              <AuthMethodDivider label="atau lanjutkan dengan" />

              {/* Social Auth: Google OAuth Only */}
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="auth-google-button"
                onClick={handleGoogleLogin}
                loading={activeMethod === "GOOGLE"}
                loadingLabel="Menghubungkan Google..."
                disabled={isAnyLoading}
              >
                <GoogleIcon />
                <span>Lanjut dengan Google</span>
              </Button>
            </div>

            {/* Bottom Switch Helper Text */}
            <div className="auth-card__switch">
              {tabMode === "SIGN_IN" ? (
                <p>
                  Belum punya akun?{" "}
                  <button
                    type="button"
                    className="auth-inline-switch-btn"
                    onClick={() => setTabMode("SIGN_UP")}
                  >
                    Daftar sekarang
                  </button>
                </p>
              ) : (
                <p>
                  Sudah punya akun?{" "}
                  <button
                    type="button"
                    className="auth-inline-switch-btn"
                    onClick={() => setTabMode("SIGN_IN")}
                  >
                    Masuk ke akun
                  </button>
                </p>
              )}
            </div>

            {/* Legal & Partner Links */}
            <footer className="auth-footer">
              <p className="auth-footer__legal">
                Dengan masuk atau mendaftar, kamu menyetujui{" "}
                <button
                  type="button"
                  className="auth-legal-link"
                  onClick={() => setLegalModal("terms")}
                >
                  Syarat &amp; Ketentuan
                </button>{" "}
                serta{" "}
                <button
                  type="button"
                  className="auth-legal-link"
                  onClick={() => setLegalModal("privacy")}
                >
                  Kebijakan Privasi
                </button>{" "}
                JedaIn.
              </p>

              <div className="auth-footer__partner">
                <Link to="/partner" className="auth-partner-link">
                  Masuk sebagai Partner Event Organizer / Destinasi &rarr;
                </Link>
              </div>
            </footer>
          </div>
        </main>
      </div>

      <Dialog
        open={legalModal === "terms"}
        title="Syarat & Ketentuan"
        description="Informasi ketentuan penggunaan layanan."
        onClose={() => setLegalModal(null)}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setLegalModal(null)}
          >
            Tutup
          </Button>
        }
      >
        <p className="auth-legal-modal-text">
          Dokumen Syarat &amp; Ketentuan lengkap belum disertakan dalam
          prototype MVP JedaIn. Konten legal final akan difinalkan sebelum
          penggunaan produksi.
        </p>
      </Dialog>

      <Dialog
        open={legalModal === "privacy"}
        title="Kebijakan Privasi"
        description="Informasi pengelolaan data pribadi."
        onClose={() => setLegalModal(null)}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setLegalModal(null)}
          >
            Tutup
          </Button>
        }
      >
        <p className="auth-legal-modal-text">
          Dokumen Kebijakan Privasi lengkap belum disertakan dalam prototype MVP
          JedaIn. Ketentuan pengelolaan data final akan difinalkan sebelum
          penggunaan produksi.
        </p>
      </Dialog>
    </div>
  );
}
