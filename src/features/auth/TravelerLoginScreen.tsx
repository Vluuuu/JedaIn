import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { env } from "../../lib/config/env";
import { AuthMethodDivider } from "./AuthMethodDivider";
import { EmailAuthForm } from "./EmailAuthForm";
import { GoogleIcon } from "./GoogleIcon";
import { defaultAuthAdapter } from "./mockAdapter";
import { PhoneOtpForm } from "./PhoneOtpForm";
import { getAuthRedirectPath } from "./routing";
import type {
  AuthAdapter,
  AuthState,
  AuthUser,
  PhoneOtpSession,
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
  const [globalError, setGlobalError] = useState<string | undefined>();
  const [fieldError, setFieldError] = useState<string | undefined>();

  // Form states preserved across recoverable errors
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otpSession, setOtpSession] = useState<PhoneOtpSession | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const isLoading =
    authState === "AUTHENTICATING" || authState === "OTP_VERIFYING";

  const handleAuthSuccess = (user: AuthUser) => {
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
    if (isLoading) return;
    setGlobalError(undefined);
    setFieldError(undefined);
    setAuthState("AUTHENTICATING");

    try {
      const user = await adapter.loginWithGoogle();
      setAuthState("IDLE");
      handleAuthSuccess(user);
    } catch (err: unknown) {
      setAuthState("ERROR");
      setGlobalError(
        err instanceof Error ? err.message : "Gagal masuk dengan Google.",
      );
    }
  };

  const handleRequestPhoneOtp = async (inputPhone: string) => {
    if (isLoading) return;
    setGlobalError(undefined);
    setFieldError(undefined);
    setPhone(inputPhone);
    setAuthState("AUTHENTICATING");

    try {
      const session = await adapter.requestPhoneOtp(inputPhone);
      setOtpSession(session);
      setAuthState("OTP_SENT");
    } catch (err: unknown) {
      setAuthState("ERROR");
      setFieldError(err instanceof Error ? err.message : "Gagal mengirim OTP.");
    }
  };

  const handleVerifyPhoneOtp = async (code: string) => {
    if (isLoading || !otpSession) return;
    setGlobalError(undefined);
    setFieldError(undefined);
    setAuthState("OTP_VERIFYING");

    try {
      const user = await adapter.verifyPhoneOtp({
        phone: otpSession.phone,
        verificationId: otpSession.verificationId,
        code,
      });
      setAuthState("IDLE");
      handleAuthSuccess(user);
    } catch (err: unknown) {
      setAuthState("ERROR");
      setFieldError(
        err instanceof Error ? err.message : "Kode OTP tidak valid.",
      );
    }
  };

  const handleResetToPhone = () => {
    setOtpSession(null);
    setFieldError(undefined);
    setGlobalError(undefined);
    setAuthState("IDLE");
  };

  const handleRequestEmailLink = async (inputEmail: string) => {
    if (isLoading || !adapter.requestEmailLink) return;
    setGlobalError(undefined);
    setFieldError(undefined);
    setAuthState("AUTHENTICATING");

    try {
      await adapter.requestEmailLink(inputEmail);
      setEmailSent(true);
      setAuthState("IDLE");
    } catch (err: unknown) {
      setAuthState("ERROR");
      setFieldError(
        err instanceof Error ? err.message : "Gagal mengirim email.",
      );
    }
  };

  return (
    <div className="auth-container">
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

        {globalError && (
          <div className="auth-error-banner" role="alert">
            <p>{globalError}</p>
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
            loading={authState === "AUTHENTICATING" && !otpSession}
            loadingLabel="Menghubungkan Google..."
            disabled={isLoading}
          >
            <GoogleIcon />
            <span>Lanjut dengan Google</span>
          </Button>

          <AuthMethodDivider />

          {/* Alternative 1: Phone OTP */}
          <PhoneOtpForm
            phone={phone}
            onPhoneChange={setPhone}
            onRequestOtp={handleRequestPhoneOtp}
            onVerifyOtp={handleVerifyPhoneOtp}
            onResetToPhone={handleResetToPhone}
            isOtpSent={
              Boolean(otpSession) ||
              authState === "OTP_SENT" ||
              authState === "OTP_VERIFYING"
            }
            isLoading={isLoading}
            error={fieldError}
          />

          {/* Alternative 2: Email Magic Link (Configurable) */}
          {enableEmailAuth && (
            <>
              <AuthMethodDivider label="atau dengan email" />
              <EmailAuthForm
                email={email}
                onEmailChange={setEmail}
                onRequestEmailLink={handleRequestEmailLink}
                isLoading={isLoading}
                isSent={emailSent}
                error={fieldError}
              />
            </>
          )}
        </div>

        <footer className="auth-footer">
          <p>
            Dengan masuk atau mendaftar, kamu menyetujui{" "}
            <a href="#terms" onClick={(e) => e.preventDefault()}>
              Syarat & Ketentuan
            </a>{" "}
            serta{" "}
            <a href="#privacy" onClick={(e) => e.preventDefault()}>
              Kebijakan Privasi
            </a>{" "}
            JedaIn.
          </p>
          <Link to="/partner" className="auth-partner-link">
            Masuk sebagai Partner Event Organizer / Destinasi &rarr;
          </Link>
        </footer>
      </div>
    </div>
  );
}
