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
      <label
        htmlFor="participant-count-val"
        className="checkout-quantity-label"
      >
        Jumlah peserta
      </label>
      <div className="checkout-quantity-stepper">
        <button
          type="button"
          className="checkout-quantity-btn"
          onClick={handleDecrement}
          disabled={isDecrementDisabled}
          aria-label="Kurangi jumlah peserta"
        >
          −
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
          +
        </button>
      </div>
    </div>
  );
}
