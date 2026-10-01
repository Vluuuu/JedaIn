import { Button } from "../../components/ui";
import {
  createDepartureOption,
  type DepartureOption,
} from "../departure/departureOptions";

export function DepartureOptionsEditor({
  options,
  onChange,
}: {
  options: DepartureOption[];
  onChange: (options: DepartureOption[]) => void;
}) {
  const update = (id: string, patch: Partial<DepartureOption>) =>
    onChange(
      options.map((option) =>
        option.id === id ? { ...option, ...patch } : option,
      ),
    );
  return (
    <section
      className="eo-builder-subgroup"
      aria-labelledby="departure-options-heading"
    >
      <h3 id="departure-options-heading" className="eo-builder-subgroup__title">
        Titik Keberangkatan
      </h3>
      <p className="eo-builder-subgroup__desc">
        Tambahkan satu atau beberapa pilihan keberangkatan. Harga dapat berbeda
        sesuai titik keberangkatan.
      </p>
      <div className="eo-departure-list">
        {options.map((option, index) => (
          <fieldset key={option.id} className="eo-departure-card">
            <legend>Titik keberangkatan {index + 1}</legend>
            <div className="eo-departure-fields">
              <div className="eo-form-group">
                <label
                  className="eo-form-label"
                  htmlFor={`departure-area-${option.id}`}
                >
                  Area keberangkatan *
                </label>
                <input
                  id={`departure-area-${option.id}`}
                  className="eo-form-input"
                  value={option.areaLabel}
                  onChange={(e) =>
                    update(option.id, { areaLabel: e.target.value })
                  }
                  placeholder="Contoh: Malang"
                  required
                />
              </div>
              <div className="eo-form-group">
                <label
                  className="eo-form-label"
                  htmlFor={
                    index === 0 ? "meeting-point" : `meeting-point-${option.id}`
                  }
                >
                  Titik Kumpul *
                </label>
                <input
                  id={
                    index === 0 ? "meeting-point" : `meeting-point-${option.id}`
                  }
                  className="eo-form-input"
                  value={option.meetingPointLabel}
                  onChange={(e) =>
                    update(option.id, { meetingPointLabel: e.target.value })
                  }
                  placeholder="Contoh: Alun-Alun Kota Malang"
                  required
                />
              </div>
              <div className="eo-form-group">
                <label
                  className="eo-form-label"
                  htmlFor={
                    index === 0
                      ? "departure-time"
                      : `departure-time-${option.id}`
                  }
                >
                  Waktu Kumpul / Keberangkatan *
                </label>
                <input
                  id={
                    index === 0
                      ? "departure-time"
                      : `departure-time-${option.id}`
                  }
                  className="eo-form-input"
                  value={option.departureTimeLabel}
                  onChange={(e) =>
                    update(option.id, { departureTimeLabel: e.target.value })
                  }
                  placeholder="Contoh: 07.00 WIB"
                  required
                />
              </div>
              <div className="eo-form-group">
                <label
                  className="eo-form-label"
                  htmlFor={`departure-price-${option.id}`}
                >
                  Harga per orang *
                </label>
                <div className="eo-departure-currency">
                  <span>Rp</span>
                  <input
                    id={`departure-price-${option.id}`}
                    type="text"
                    inputMode="numeric"
                    aria-invalid={
                      option.pricePerPerson < 0 ||
                      !Number.isSafeInteger(option.pricePerPerson)
                    }
                    className="eo-form-input"
                    value={
                      option.pricePerPerson
                        ? option.pricePerPerson.toLocaleString("id-ID")
                        : ""
                    }
                    onChange={(e) =>
                      update(option.id, {
                        pricePerPerson:
                          (e.target.value.trimStart().startsWith("-")
                            ? -1
                            : 1) * Number(e.target.value.replace(/\D/g, "")),
                      })
                    }
                    placeholder="0"
                    required
                  />
                  <span>/ orang</span>
                </div>
              </div>
            </div>
            {options.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  onChange(options.filter((item) => item.id !== option.id))
                }
                aria-label={`Hapus titik keberangkatan ${index + 1}`}
              >
                Hapus opsi
              </Button>
            )}
          </fieldset>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        size="md"
        onClick={() => onChange([...options, createDepartureOption()])}
      >
        + Tambah Titik Keberangkatan
      </Button>
    </section>
  );
}
