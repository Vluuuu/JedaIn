import { Badge } from "../../components/ui";
import { formatSessionDateTimeRange } from "../packageDetail/formatSessionDate";
import type { PackageSessionPreview } from "../packageDetail/types";

export interface SessionCardProps {
  session: PackageSessionPreview;
  isSelected: boolean;
  onSelect: (sessionId: string) => void;
  disabled?: boolean;
}

export function SessionCard({
  session,
  isSelected,
  onSelect,
  disabled = false,
}: SessionCardProps) {
  const { dateLabel } = formatSessionDateTimeRange(
    session.startAt,
    session.endAt,
  );

  const isSelectable =
    session.status === "OPEN" &&
    session.remainingSlots !== undefined &&
    session.remainingSlots > 0 &&
    !disabled;

  const statusLabel =
    session.status === "OPEN"
      ? session.remainingSlots === undefined
        ? "Ketersediaan perlu dicek ulang"
        : session.remainingSlots === 0
          ? "Penuh"
          : "Tersedia"
      : session.status === "FULL"
        ? "Penuh"
        : "Ditutup";

  const statusTone =
    session.status === "OPEN" &&
    session.remainingSlots !== undefined &&
    session.remainingSlots > 0
      ? "success"
      : "neutral";

  const formattedPrice =
    session.pricePerPerson !== undefined
      ? `Rp${session.pricePerPerson.toLocaleString("id-ID")} / orang`
      : undefined;

  return (
    <div
      className={`session-card ${isSelected ? "session-card--selected" : ""} ${
        !isSelectable ? "session-card--disabled" : ""
      }`}
      onClick={() => isSelectable && onSelect(session.sessionId)}
    >
      <div className="session-card__radio-wrap">
        <input
          type="radio"
          id={`session-radio-${session.sessionId}`}
          name="session-choice"
          value={session.sessionId}
          checked={isSelected}
          disabled={!isSelectable}
          onChange={() => isSelectable && onSelect(session.sessionId)}
          className="session-card__radio"
          aria-describedby={`session-desc-${session.sessionId}`}
        />
      </div>

      <div className="session-card__content">
        <label
          htmlFor={`session-radio-${session.sessionId}`}
          className="session-card__label"
        >
          <span className="session-card__date-text">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="session-card__calendar-icon"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{dateLabel}</span>
          </span>
        </label>

        <div
          id={`session-desc-${session.sessionId}`}
          className="session-card__meta-row"
        >
          <Badge tone={statusTone}>{statusLabel}</Badge>
          {session.remainingSlots !== undefined &&
            session.remainingSlots > 0 && (
              <span className="session-card__slot-info">
                Sisa {session.remainingSlots} slot
              </span>
            )}
          {formattedPrice && (
            <span className="session-card__price">{formattedPrice}</span>
          )}
        </div>
      </div>
    </div>
  );
}
