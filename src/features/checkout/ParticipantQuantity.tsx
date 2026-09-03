export interface ParticipantQuantityProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export function ParticipantQuantity({
  value,
  min = 1,
  max = 99,
  onChange,
  disabled = false,
}: ParticipantQuantityProps) {
  const isDecrementDisabled = disabled || value <= min;
  const isIncrementDisabled = disabled || value >= max;

  const handleDecrement = () => {
    if (!isDecrementDisabled) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (!isIncrementDisabled) {
      onChange(value + 1);
    }
  };

  return (
    <div
      className="checkout-quantity-wrap"
      aria-label="Pengaturan jumlah peserta"
    >
      <div className="checkout-quantity-header">
        <label
          htmlFor="participant-count-val"
          className="checkout-quantity-label"
        >
          Jumlah peserta
        </label>
        <span className="checkout-quantity-hint">
          Sesuai kapasitas yang tersedia
        </span>
      </div>
      <div className="checkout-quantity-stepper">
        <button
          type="button"
          className="checkout-quantity-btn"
          onClick={handleDecrement}
          disabled={isDecrementDisabled}
          aria-label="Kurangi jumlah peserta"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span
          id="participant-count-val"
          className="checkout-quantity-value"
          aria-live="polite"
        >
          {value}
        </span>
        <button
          type="button"
          className="checkout-quantity-btn"
          onClick={handleIncrement}
          disabled={isIncrementDisabled}
          aria-label="Tambah jumlah peserta"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
