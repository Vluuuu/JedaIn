import { useState, type FormEvent } from "react";
import { Button, TextField } from "../../components/ui";

export interface PhoneEntryFormProps {
  initialPhone: string;
  onRequestOtp: (phone: string) => Promise<void>;
  onSkipDemo?: () => void;
  isSubmitting: boolean;
  isDisabled: boolean;
  error?: string;
}

export function PhoneEntryForm({
  initialPhone,
  onRequestOtp,
  onSkipDemo,
  isSubmitting,
  isDisabled,
  error,
}: PhoneEntryFormProps) {
  const [phone, setPhone] = useState(initialPhone);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed || isDisabled || isSubmitting) return;
    await onRequestOtp(trimmed);
  };

  return (
    <form
      className="contact-verification-form"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Form nomor telepon"
    >
      <TextField
        id="contact-phone-input"
        name="phone"
        label="Nomor HP"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="Contoh: 08123456789"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        disabled={isDisabled || isSubmitting}
        error={error}
        required
      />

      <div className="contact-verification-actions">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          loadingLabel="Mengirim kode..."
          disabled={isDisabled || !phone.trim()}
          className="contact-verification-submit-btn"
        >
          Kirim Kode OTP
        </Button>

        {onSkipDemo && (
          <div className="contact-verification-demo-skip-wrap">
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={isDisabled || isSubmitting}
              onClick={onSkipDemo}
              className="contact-verification-demo-skip-btn"
            >
              Lewati untuk Demo
            </Button>
            <p className="contact-verification-demo-hint">
              Untuk demo, verifikasi nomor dapat dilewati.
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
