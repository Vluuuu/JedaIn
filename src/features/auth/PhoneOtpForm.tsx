import { useState, type FormEvent } from "react";
import { Button, TextField } from "../../components/ui";
import "./auth.css";

export interface PhoneOtpFormProps {
  phone: string;
  onPhoneChange: (val: string) => void;
  onRequestOtp: (phone: string) => Promise<void>;
  onVerifyOtp: (code: string) => Promise<void>;
  onResetToPhone: () => void;
  isOtpSent: boolean;
  isSubmitting: boolean;
  isDisabled: boolean;
  error?: string;
}

export function PhoneOtpForm({
  phone,
  onPhoneChange,
  onRequestOtp,
  onVerifyOtp,
  onResetToPhone,
  isOtpSent,
  isSubmitting,
  isDisabled,
  error,
}: PhoneOtpFormProps) {
  const [otpCode, setOtpCode] = useState("");

  const handlePhoneSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formPhone = (formData.get("phone") as string) || phone;
    if (!formPhone.trim() || isDisabled) return;
    await onRequestOtp(formPhone);
  };

  const handleOtpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formOtp = (formData.get("otp") as string) || otpCode;
    if (!formOtp.trim() || isDisabled) return;
    await onVerifyOtp(formOtp);
  };

  if (isOtpSent) {
    return (
      <form
        className="auth-phone-form"
        onSubmit={handleOtpSubmit}
        noValidate
        aria-label="Verifikasi kode OTP"
      >
        <div className="auth-phone-form__info">
          <p>
            Kode verifikasi telah dikirim ke <strong>{phone}</strong>
          </p>
          <button
            type="button"
            className="auth-change-phone-button"
            onClick={() => {
              setOtpCode("");
              onResetToPhone();
            }}
            disabled={isDisabled}
          >
            Ubah nomor
          </button>
        </div>

        <TextField
          id="otp-code-input"
          name="otp"
          label="Kode OTP"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Masukkan kode OTP"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
          disabled={isDisabled}
          error={error}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          loadingLabel="Memverifikasi..."
          disabled={isDisabled}
          className="auth-submit-button"
        >
          Verifikasi & Masuk
        </Button>
      </form>
    );
  }

  return (
    <form
      className="auth-phone-form"
      onSubmit={handlePhoneSubmit}
      noValidate
      aria-label="Masuk dengan nomor HP"
    >
      <TextField
        id="phone-number-input"
        name="phone"
        label="Nomor HP"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="Contoh: 08123456789"
        helperText="Kami akan mengirimkan kode verifikasi OTP."
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        disabled={isDisabled}
        error={error}
        required
      />

      <Button
        type="submit"
        variant="secondary"
        size="lg"
        loading={isSubmitting}
        loadingLabel="Mengirim kode..."
        disabled={isDisabled}
        className="auth-submit-button"
      >
        Kirim Kode OTP
      </Button>
    </form>
  );
}
