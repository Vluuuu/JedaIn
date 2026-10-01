export function PartnerAccountPasswordField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="eo-form-group">
      <label htmlFor="partner-registration-password" className="eo-form-label">
        Kata sandi akun mitra *
      </label>
      <input
        id="partner-registration-password"
        className="eo-form-input"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="eo-form-helper">
        Minimal 8 karakter. Gunakan email dan kata sandi ini untuk masuk kembali
        setelah pendaftaran.
      </span>
    </div>
  );
}
