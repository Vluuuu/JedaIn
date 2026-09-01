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
          <span className="session-card__date-text">{dateLabel}</span>
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
