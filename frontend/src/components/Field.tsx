import type { InputHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  mono?: boolean;
  hint?: string;
}

export default function Field({
  label,
  mono,
  hint,
  className = "",
  ...rest
}: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <div className="field-label mb-1.5">{label}</div>
      <input
        {...rest}
        className={`field-input ${mono ? "is-mono" : ""}`}
      />
      {hint && (
        <div className="font-mono text-[0.66rem] text-ink-3 mt-1 tracking-wider">
          {hint}
        </div>
      )}
    </label>
  );
}
