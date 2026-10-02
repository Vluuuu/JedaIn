import { useId } from "react";
import { formatRupiah } from "../checkout/pricing";
import type { DepartureOption } from "./departureOptions";
import "./departure.css";

interface Props {
  options: DepartureOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function DepartureChoices({
  options,
  selectedId,
  onSelect,
  disabled,
}: Props) {
  const groupId = useId();
  return (
    <fieldset className="departure-choices">
      <legend className="departure-choices__title">
        Pilih titik keberangkatan
      </legend>
      <p className="departure-choices__hint">
        Pilih titik kumpul yang sesuai. Harga berlaku per orang.
      </p>
      <div className="departure-choices__list">
        {options.map((option) => (
          <label
            key={option.id}
            className={`departure-choice ${selectedId === option.id ? "departure-choice--selected" : ""}`}
          >
            <input
              type="radio"
              name={groupId}
              value={option.id}
              checked={selectedId === option.id}
              onChange={() => onSelect(option.id)}
              disabled={disabled}
            />
            <span className="departure-choice__body">
              <strong>{option.areaLabel || "Keberangkatan paket"}</strong>
              <span>
                {option.meetingPointLabel || "Titik kumpul belum dicantumkan"}
              </span>
              <span>
                {option.departureTimeLabel || "Waktu kumpul belum dicantumkan"}
              </span>
              <strong className="departure-choice__price">
                {formatRupiah(option.pricePerPerson)} / orang
              </strong>
              {selectedId === option.id && (
                <span className="departure-choice__selected">✓ Terpilih</span>
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function DepartureSummary({
  departure,
}: {
  departure: Pick<
    DepartureOption,
    "areaLabel" | "meetingPointLabel" | "departureTimeLabel"
  >;
}) {
  return (
    <dl className="departure-summary">
      <div>
        <dt>Titik keberangkatan</dt>
        <dd>{departure.areaLabel || "Belum dicantumkan"}</dd>
      </div>
      <div>
        <dt>Titik kumpul</dt>
        <dd>{departure.meetingPointLabel || "Belum dicantumkan"}</dd>
      </div>
      <div>
        <dt>Waktu kumpul</dt>
        <dd>{departure.departureTimeLabel || "Belum dicantumkan"}</dd>
      </div>
    </dl>
  );
}
