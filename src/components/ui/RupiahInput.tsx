import type { InputHTMLAttributes } from "react";

interface RupiahInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "min"
> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
}

export function RupiahInput({
  value,
  onChange,
  min = 0,
  ...props
}: RupiahInputProps) {
  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      value={value ? value.toLocaleString("id-ID") : ""}
      aria-invalid={!Number.isSafeInteger(value) || value < min}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => {
        const text = event.target.value;
        onChange(
          (text.trimStart().startsWith("-") ? -1 : 1) *
            Number(text.replace(/\D/g, "")),
        );
      }}
    />
  );
}
