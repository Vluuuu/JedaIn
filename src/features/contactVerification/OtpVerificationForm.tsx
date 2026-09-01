import { useEffect, useState, type FormEvent } from "react";
import { Button, TextField } from "../../components/ui";
import type { OtpVerificationSession } from "./types";

export interface OtpVerificationFormProps {
  session: OtpVerificationSession;
  onVerifyOtp: (code: string) => Promise<void>;
  onResendOtp: () => Promise<void>;
  onChangePhone: () => void;
  isSubmitting: boolean;
  isDisabled: boolean;
  error?: string;
}

function calculateSecondsRemaining(resendAvailableAtIso: string): number {
  const expiry = new Date(resendAvailableAtIso).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((expiry - now) / 1000));
}

export function OtpVerificationForm({
  session,
  onVerifyOtp,
  onResendOtp,
  onChangePhone,
  isSubmitting,
  isDisabled,
  error,
}: OtpVerificationFormProps) {
  const [otpCode, setOtpCode] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(() =>
    calculateSecondsRemaining(session.resendAvailableAt),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateSecondsRemaining(session.resendAvailableAt);
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session.resendAvailableAt]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formOtp = (formData.get("otp") as string) || otpCode;
    const trimmed = formOtp.trim();
    if (!trimmed || isDisabled || isSubmitting) return;
    await onVerifyOtp(trimmed);
  };

  const isResendDisabled = isDisabled || isSubmitting || secondsRemaining > 0;

  return (
    <form
      className="contact-verification-form"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Verifikasi kode OTP"
    >
      <div className="contact-verification-info-box">
        <p>
          Kode verifikasi telah dikirim ke <strong>{session.phone}</strong>
        </p>
        <button
          type="button"
          className="contact-verification-change-phone-btn"
          onClick={onChangePhone}
          disabled={isDisabled || isSubmitting}
        >
          Ubah nomor
        </button>
      </div>

      <TextField
        id="contact-otp-input"
        name="otp"
        label="Kode OTP"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="Masukkan 6 digit kode OTP"
        value={otpCode}
        onChange={(e) => setOtpCode(e.target.value)}
        disabled={isDisabled || isSubmitting}
        error={error}
        required
      />

      <div className="contact-verification-resend-row">
        <button
          type="button"
          className="contact-verification-resend-btn"
          onClick={onResendOtp}
          disabled={isResendDisabled}
        >
          Kirim ulang kode
        </button>
        {secondsRemaining > 0 && (
          <span className="contact-verification-countdown" aria-live="polite">
            Sisa waktu: <strong>{secondsRemaining} dtk</strong>
          </span>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isSubmitting}
        loadingLabel="Memverifikasi..."
        disabled={isDisabled}
        className="contact-verification-submit-btn"
      >
        Verifikasi & Lanjut
      </Button>
    </form>
  );
}
