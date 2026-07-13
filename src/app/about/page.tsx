import type { Metadata } from "next";
import Link from "next/link";
import { PILLAR_META } from "@/types/post";
import type { Pillar } from "@/types/post";

export const metadata: Metadata = {
  title: "About",
  description:
    "What DARQ Era is, why the four pillars matter together, and who's behind it.",
};

const pillarBlurbs: Record<Pillar, string> = {
  D: "Who owns the rails — Web3, onchain infrastructure, and the shift from platforms to protocols.",
  A: "The primary pillar. Agents, model releases, and capability shifts that change what builders can ship.",
  R: "XR, AR, and spatial computing — where the interface stops being a rectangle.",
  Q: "Quantum, impact-framed. Not the mechanics — what breaks and what becomes possible.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <p
        className="text-[11px] font-semibold tracking-[0.18em] uppercase mb-4"
        style={{ color: "var(--brand-cyan)" }}
      >
        About
      </p>
      <h1
        className="font-[family-name:var(--font-space-grotesk)] font-bold text-[clamp(2rem,5vw,3rem)] leading-[1.1] tracking-[-0.025em] mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        A translation layer between tech and culture.
      </h1>

      <div
        className="flex flex-col gap-4 text-base leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        <p>
          Four technologies are converging — Decentralization, AI, extended
          Reality, and Quantum computing. Most coverage treats them as separate
          beats. DARQ Era covers the conversation between them.
        </p>
        <p>
          The mandate is simple: don&apos;t just explain what&apos;s happening.
          Explain what it means before everyone else realizes it. Written from
          a builder&apos;s perspective — not academic, not hype.
        </p>
        <p>
          Every post starts as a signal: a topic validated across multiple
          independent sources by our signal pipeline, then researched and
          written in one voice. The three-bar Signal Strength on each post
          marks where the shift sits on the adoption curve — early, emerging,
          or already here.
        </p>
      </div>

      {/* Pillars */}
      <h2
        className="font-[family-name:var(--font-space-grotesk)] font-semibold text-xl mt-12 mb-5 tracking-[-0.02em]"
        style={{ color: "var(--text-primary)" }}
      >
        The four pillars
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {(Object.keys(PILLAR_META) as Pillar[]).map((p) => {
          const meta = PILLAR_META[p];
          return (
            <Link
              key={p}
              href={meta.href}
              className="group p-4 rounded-[0.125rem] transition-transform duration-150 hover:-translate-y-px"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-ghost)",
              }}
            >
              <p
                className="font-[family-name:var(--font-space-grotesk)] font-bold text-sm tracking-widest uppercase mb-2"
                style={{ color: `var(--pillar-${p.toLowerCase()})` }}
              >
                {p} — {meta.full}
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {pillarBlurbs[p]}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Who */}
      <h2
        className="font-[family-name:var(--font-space-grotesk)] font-semibold text-xl mt-12 mb-4 tracking-[-0.02em]"
        style={{ color: "var(--text-primary)" }}
      >
        Who&apos;s behind it
      </h2>
      <p
        className="text-base leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        DARQ Era is built by Noel Rhymer — site reliability engineer by day,
        builder of AI tools and pipelines the rest of the time. This site is
        itself a build log: the signal pipeline that feeds it is part of the
        story.
      </p>

      <p
        className="mt-10 text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        Follow along:{" "}
        <Link
          href="/feed.xml"
          className="underline underline-offset-4 hover:opacity-80 transition-opacity"
          style={{ color: "var(--brand-cyan)" }}
        >
          RSS feed
        </Link>
      </p>
    </div>
  );
}
