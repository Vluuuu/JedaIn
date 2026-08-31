import { useId, type ReactNode } from "react";
import "./ui.css";

export interface ErrorStateProps {
  title: string;
  description: string;
  safeMessage?: string;
  action?: ReactNode;
}

export function ErrorState({
  title,
  description,
  safeMessage,
  action,
}: ErrorStateProps) {
  const titleId = useId();

  return (
    <section
      className="ui-state ui-state--error"
      role="alert"
      aria-labelledby={titleId}
    >
      <span className="ui-state__symbol" aria-hidden="true">
        !
      </span>
      <h2 id={titleId}>{title}</h2>
      <p>{description}</p>
      {safeMessage && <p className="ui-state__safe">{safeMessage}</p>}
      {action && <div className="ui-state__action">{action}</div>}
    </section>
  );
}
