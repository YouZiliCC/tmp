interface RuleHrProps {
  variant?: "hair" | "thick" | "double" | "soft" | "fade";
  className?: string;
}

export default function RuleHr({ variant = "hair", className = "" }: RuleHrProps) {
  if (variant === "fade") return <div className={`hr-fade ${className}`} />;
  const cls =
    variant === "thick"
      ? "rule-thick"
      : variant === "double"
      ? "rule-double"
      : variant === "soft"
      ? "rule-soft"
      : "rule";
  return <hr className={`${cls} border-0 ${className}`} />;
}
