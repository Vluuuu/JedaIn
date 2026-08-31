import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Badge, Button, Dialog } from "../../components/ui";
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
        // OAuth cancellation is not a catastrophic error; gracefully return to IDLE
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
    <div className="auth-container">
      <div className="auth-layout">
        {/* Desktop Visual Hero Story */}
        <div
          className="auth-visual-hero"
          style={{
            backgroundImage: `url("${LOGIN_ATMOSPHERE_VISUAL.svgDataUri}")`,
          }}
          aria-hidden="true"
        >
          <div className="auth-visual-hero__overlay">
            <span className="auth-visual-hero__tag">Kurasi Wellness Lokal</span>
            <h2 className="auth-visual-hero__title">
              Temukan jeda yang benar-benar kamu butuhkan.
            </h2>
            <p className="auth-visual-hero__desc">
              Experience wellness terkurasi bersama destinasi lokal
              terverifikasi.
            </p>
          </div>
        </div>

        <div className="auth-card">
          <header className="auth-header">
            <div className="auth-header__badge">
              <Badge tone="info">Traveler Portal</Badge>
            </div>
            <h1>Masuk atau mulai perjalananmu</h1>
            <p>
              Temukan jeda yang terkurasi dan personal dengan pengalaman lokal
              terpercaya.
            </p>
          </header>

          {googleError && (
            <div className="auth-error-banner" role="alert">
              <p>{googleError}</p>
            </div>
          )}

          <div className="auth-actions">
            {/* Primary Action: Google OAuth */}
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

            <AuthMethodDivider />

            {/* Alternative 1: Phone OTP */}
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

            {/* Alternative 2: Email Magic Link (Configurable) */}
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
          </div>

          <footer className="auth-footer">
            <p>
              Dengan masuk atau mendaftar, kamu menyetujui{" "}
              <button
                type="button"
                className="auth-legal-link"
                onClick={() => setLegalModal("terms")}
              >
                Syarat & Ketentuan
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
            <Link to="/partner" className="auth-partner-link">
              Masuk sebagai Partner Event Organizer / Destinasi &rarr;
            </Link>
          </footer>
        </div>
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
          Dokumen Syarat & Ketentuan lengkap belum disertakan dalam prototype
          MVP JedaIn. Konten legal final akan difinalkan sebelum penggunaan
          produksi.
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
