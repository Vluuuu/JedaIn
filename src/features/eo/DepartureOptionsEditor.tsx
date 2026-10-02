import { Button } from "../../components/ui";
import { RupiahInput } from "../../components/ui/RupiahInput";
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
        Isi biaya perjalanan dari setiap titik kumpul per orang. Harga paket
        otomatis menambahkan biaya destinasi, pemandu yang dipakai, dan margin
        TO.
      </p>
      <div className="eo-departure-list">
        {options.map((option, index) => (
          <fieldset key={option.id} className="eo-departure-card">
            <legend className="eo-departure-legend">
              <span>Titik keberangkatan {index + 1}</span>
            </legend>
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
                  Biaya keberangkatan per orang *
                </label>
                <div className="eo-departure-currency">
                  <span>Rp</span>
                  <RupiahInput
                    id={`departure-price-${option.id}`}
                    className="eo-form-input"
                    value={option.departureCostPerPerson ?? 0}
                    showZero={option.departureCostPerPerson != null}
                    onEmpty={() =>
                      update(option.id, { departureCostPerPerson: null })
                    }
                    onChange={(departureCostPerPerson) =>
                      update(option.id, { departureCostPerPerson })
                    }
                    min={0}
                    placeholder="0"
                    required
                  />
                  <span>/ orang</span>
                </div>
                <span className="eo-form-helper">
                  Biaya transportasi/perjalanan dari titik kumpul, di luar biaya
                  destinasi dan margin TO. Isi 0 jika tidak ada biaya
                  keberangkatan.
                </span>
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
