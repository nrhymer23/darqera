"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

type Status = "idle" | "loading" | "success" | "error";

interface Props {
  /** "post" = end-of-post card; "band" = full-width homepage band. */
  variant?: "post" | "band";
}

export default function NewsletterCapture({ variant = "post" }: Props) {
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
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <section id="subscribe" className={`sub sub--${variant}`} aria-labelledby="sub-h">
      <div className="sub__inner">
        <div>
          <h2 id="sub-h" className="sub__h">Get each day in your inbox.</h2>
          <p className="sub__p">
            Thirty days, four pillars, one post a morning. No spam.
          </p>
        </div>
        <div>
          {status === "success" ? (
            <p className="sub__ok" role="status">
              You&apos;re in. See you tomorrow morning.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="sub__field">
              <label htmlFor="sub-email" className="sr-only">
                Email address
              </label>
              <input
                id="sub-email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <button type="submit" className="btn-cyan" disabled={status === "loading"}>
                {status === "loading" ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
          )}
          {status === "error" && (
            <p className="sub__err" role="alert">
              {errorMsg}
            </p>
          )}
          <p className="sub__fine">
            One click to unsubscribe. Prefer a reader? <a href="/feed.xml">RSS feed</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
