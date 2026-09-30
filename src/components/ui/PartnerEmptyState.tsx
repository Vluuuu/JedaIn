import type { ReactNode } from "react";
import RestMascot from "../../assets/mascot/rest.png";

interface PartnerEmptyStateProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

export function PartnerEmptyState({
  title,
  children,
  action,
}: PartnerEmptyStateProps) {
  return (
    <div className="partner-empty-state">
      <img
        className="partner-empty-state__mascot"
        src={RestMascot}
        alt=""
        aria-hidden="true"
        width="535"
        height="633"
        loading="lazy"
      />
      <div className="partner-empty-state__content">
        <strong>{title}</strong>
        <p>{children}</p>
        {action}
      </div>
    </div>
  );
}
