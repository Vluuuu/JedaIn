import "./auth.css";

export function AuthMethodDivider({ label = "atau" }: { label?: string }) {
  return (
    <div className="auth-divider" role="separator">
      <span className="auth-divider__line" />
      <span className="auth-divider__label">{label}</span>
      <span className="auth-divider__line" />
    </div>
  );
}
