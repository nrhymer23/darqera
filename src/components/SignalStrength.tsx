import { signalBars } from "@/lib/signal";

/** Signature element: 3 stacked cyan bars = how early a post sits on the adoption
 *  curve (1 early -> 3 already shifting). Brand cyan via --brand-cyan (themes light/dark). */
export default function SignalStrength({
  level = 2,
  size = "md",
}: {
  level?: number;
  size?: "sm" | "md";
}) {
  const bars = signalBars(level);
  const n = bars.filter(Boolean).length;
  const barW = size === "sm" ? 11 : 14;
  const barH = 3;
  const gap = 2;
  return (
    <span
      role="img"
      aria-label={`Signal strength: ${n} of 3`}
      style={{
        display: "inline-flex",
        flexDirection: "column-reverse",
        gap: `${gap}px`,
        verticalAlign: "middle",
      }}
    >
      {bars.map((on, i) => (
        <span
          key={i}
          style={{
            width: `${barW}px`,
            height: `${barH}px`,
            background: on ? "var(--brand-cyan)" : "#3a3a3a",
            borderRadius: "1px",
            transition: "background-color 120ms ease-out",
          }}
        />
      ))}
    </span>
  );
}
