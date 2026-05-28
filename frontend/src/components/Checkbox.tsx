interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  className?: string;
}

export default function Checkbox({
  checked,
  onChange,
  label,
  className = "",
}: CheckboxProps) {
  return (
    <label
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}
    >
      <span
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        data-checked={checked}
        className="j-check"
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onChange(!checked);
          }
        }}
      >
        {checked && (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M3 8.5 L7 12 L13 4" />
          </svg>
        )}
      </span>
      {label && (
        <span className="font-mono text-[0.74rem] tracking-wider text-ink-2 uppercase">
          {label}
        </span>
      )}
    </label>
  );
}
