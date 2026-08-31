import { useState, type FormEvent } from "react";
import { Button, TextField } from "../../components/ui";
import "./auth.css";

export interface EmailAuthFormProps {
  email: string;
  onEmailChange: (val: string) => void;
  onRequestEmailLink: (email: string) => Promise<void>;
  isSubmitting: boolean;
  isDisabled: boolean;
  isSent: boolean;
  error?: string;
}

export function EmailAuthForm({
  email,
  onEmailChange,
  onRequestEmailLink,
  isSubmitting,
  isDisabled,
  isSent,
  error,
}: EmailAuthFormProps) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isDisabled) return;
    setSubmitted(true);
    await onRequestEmailLink(email);
  };

  if (isSent) {
    return (
      <div className="auth-email-sent" role="status">
        <p>
          Tautan masuk telah dikirim ke <strong>{email}</strong>. Periksa kotak
          masuk atau folder spam Anda.
        </p>
      </div>
    );
  }

  return (
    <form
      className="auth-email-form"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Masuk dengan Email"
    >
      <TextField
        id="email-input"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="nama@email.com"
        helperText="Tautan masuk sekali pakai akan dikirim ke email."
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        disabled={isDisabled}
        error={submitted ? error : undefined}
        required
      />

      <Button
        type="submit"
        variant="secondary"
        size="lg"
        loading={isSubmitting}
        loadingLabel="Mengirim tautan..."
        disabled={isDisabled}
        className="auth-submit-button"
      >
        Kirim Tautan Masuk
      </Button>
    </form>
  );
}
