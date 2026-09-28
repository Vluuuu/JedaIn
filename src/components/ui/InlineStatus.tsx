import "./inlineStatus.css";

export interface InlineStatusProps {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}

export function InlineStatus({
  children,
  tone = "neutral",
}: InlineStatusProps) {
  return (
    <span className={`inline-status inline-status--${tone}`}>
      <span className="inline-status__dot" aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}
