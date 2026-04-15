"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

type Status = "idle" | "loading" | "success" | "error";

export default function NewsletterCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      if (!supabase) throw new Error("Database unavailable");

      const { error } = await supabase
        .from("subscribers")
        .insert({ email: email.trim().toLowerCase() });

      if (error) {
        // Unique constraint violation = already subscribed
        if (error.code === "23505") {
          setStatus("success");
          return;
        }
        throw error;
      }

      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  }

  return (
    <section
      className="relative mt-16 py-10 px-6 sm:px-8 rounded-[0.125rem] overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-ghost)",
      }}
    >
      {/* Subtle accent glow */}
      <div
        className="absolute top-0 left-0 w-full h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, #00f0ff 0%, transparent 60%)",
          opacity: 0.6,
        }}
      />

      <div className="max-w-md">
        <p
          className="text-[10px] font-semibold tracking-widest uppercase mb-3"
          style={{ color: "#00f0ff" }}
        >
          Stay in the signal
        </p>
        <h3
          className="font-[family-name:var(--font-space-grotesk)] font-bold text-xl mb-2"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          Get DARQ drops in your inbox.
        </h3>
        <p
          className="text-sm leading-relaxed mb-6"
          style={{ color: "var(--text-secondary)" }}
        >
          No spam. Just signal — the sharpest takes on Decentralization, AI,
          Reality, and Quantum, delivered when it matters.
        </p>

        {status === "success" ? (
          <div
            className="flex items-center gap-2 py-3 px-4 rounded-[0.125rem]"
            style={{
              backgroundColor: "rgba(0, 240, 255, 0.08)",
              color: "#00f0ff",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.5 4.5L6.5 11.5L2.5 7.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm font-medium tracking-wide">
              You&apos;re in. First signal incoming.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
              id="newsletter-email"
              className="flex-1 px-4 py-2.5 text-sm rounded-[0.125rem] outline-none placeholder:opacity-40"
              style={{
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-ghost)",
              }}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              id="newsletter-submit"
              className="px-5 py-2.5 text-sm font-semibold tracking-wide rounded-[0.125rem] transition-all"
              style={{
                backgroundColor: "#00f0ff",
                color: "#0e0e0e",
                opacity: status === "loading" ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.boxShadow =
                  "0 0 20px rgba(0, 240, 255, 0.3)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.boxShadow = "none";
              }}
            >
              {status === "loading" ? "..." : "Subscribe"}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="mt-3 text-xs" style={{ color: "#ff6b6b" }}>
            {errorMsg}
          </p>
        )}
      </div>
    </section>
  );
}
