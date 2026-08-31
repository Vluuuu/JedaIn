import { useId, type InputHTMLAttributes } from "react";
import "./ui.css";

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id"
> {
  id?: string;
  label: string;
  helperText?: string;
  error?: string;
}

export function TextField({
  id: providedId,
  label,
  helperText,
  error,
  required,
  className = "",
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy =
    [helperId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="ui-field">
      <label className="ui-field__label" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {helperText && (
        <span className="ui-field__helper" id={helperId}>
          {helperText}
        </span>
      )}
      <input
        id={id}
        className={`ui-input ${error ? "ui-input--error" : ""} ${className}`.trim()}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {error && (
        <span className="ui-field__error" id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export { TextField as Input };
