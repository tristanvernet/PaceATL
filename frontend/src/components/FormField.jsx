import { useId } from "react";
export default function FormField({ label, error, hint, id, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const description = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;
  return (
    <div className="form-field">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={description}
        {...props}
      />
      {error && (
        <p className="field-error" id={`${inputId}-error`}>
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="field-hint" id={`${inputId}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}
