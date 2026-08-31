import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import "./ui.css";

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type"
> {
  id?: string;
  label: ReactNode;
  description?: string;
  error?: string;
}

export function Checkbox({
  id: providedId,
  label,
  description,
  error,
  className = "",
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="ui-checkbox-field">
      <label className="ui-checkbox__label" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          className={`ui-checkbox ${className}`.trim()}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        <span>{label}</span>
      </label>
      {description && (
        <span className="ui-checkbox__description" id={descriptionId}>
          {description}
        </span>
      )}
      {error && (
        <span className="ui-field__error" id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
