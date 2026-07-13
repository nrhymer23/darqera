import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center">
      <p
        className="text-[11px] font-semibold tracking-[0.18em] uppercase mb-4"
        style={{ color: "var(--brand-cyan)" }}
      >
        Signal lost
      </p>
      <h1
        className="font-[family-name:var(--font-space-grotesk)] font-bold text-[clamp(2.5rem,7vw,4rem)] leading-none tracking-[-0.025em] mb-5"
        style={{ color: "var(--text-primary)" }}
      >
        404
      </h1>
      <p
        className="text-base leading-relaxed mb-8"
        style={{ color: "var(--text-secondary)" }}
      >
        This page doesn&apos;t exist — or the shift hasn&apos;t happened yet.
      </p>
      <Link
        href="/"
        className="inline-block px-5 py-2.5 text-sm font-semibold tracking-wide rounded-[0.125rem] transition-opacity hover:opacity-80"
        style={{ backgroundColor: "var(--brand-cyan)", color: "#0e0e0e" }}
      >
        Back to the feed
      </Link>
    </div>
  );
}
