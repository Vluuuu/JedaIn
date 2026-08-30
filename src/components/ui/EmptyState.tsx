import { useId, type ReactNode } from "react";
import "./ui.css";

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  const titleId = useId();

  return (
    <section className="ui-state" aria-labelledby={titleId}>
      <span className="ui-state__symbol" aria-hidden="true">
        ○
      </span>
      <h2 id={titleId}>{title}</h2>
      <p>{description}</p>
      {action && <div className="ui-state__action">{action}</div>}
    </section>
  );
}
