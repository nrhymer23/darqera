"use client";

import { useEffect, useState } from "react";

import type { ResearchPacketDetail as PacketDetail } from "@/lib/research/types";

interface Props {
  packet: PacketDetail;
  adminKey: string;
  onRefresh: () => void | Promise<void>;
}

const stateLabels: Record<PacketDetail["state"], string> = {
  researching: "Researching",
  awaiting_review: "Awaiting review",
  more_research_requested: "More research requested",
  approved: "Approved",
  drafting: "Drafting",
  draft_ready: "Draft ready",
  rejected: "Rejected",
  research_failed: "Research failed",
  draft_failed: "Draft failed",
};

function actionKey(action: string, packetId: string) {
  return `${action}-${packetId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ResearchPacketDetail({ packet, adminKey, onRefresh }: Props) {
  const latest = packet.revisions[0]?.packet;
  const [angle, setAngle] = useState(packet.proposed_angle || latest?.proposed_angle || "");
  const [feedback, setFeedback] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setAngle(packet.proposed_angle || latest?.proposed_angle || "");
    setFeedback("");
    setReason("");
    setError("");
  }, [packet.id, packet.proposed_angle, latest?.proposed_angle]);

  async function act(
    action: "approve" | "reject" | "request_more_research" | "edit_angle" | "retry",
  ) {
    if (busy) return;
    if (action === "request_more_research" && !feedback.trim()) {
      setError("Tell the researcher what needs another look");
      return;
    }
    if ((action === "approve" || action === "edit_angle") && !angle.trim()) {
      setError("Add a proposed angle first");
      return;
    }
    setBusy(action);
    setError("");
    try {
      const response = await fetch(`/api/admin/research/${packet.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          action,
          expectedState: packet.state,
          expectedVersion: packet.version,
          idempotencyKey: actionKey(action, packet.id),
          angle: angle.trim() || undefined,
          feedback: feedback.trim() || undefined,
          reason: reason.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Research action failed");
      await onRefresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Research action failed");
    } finally {
      setBusy(null);
    }
  }

  if (!latest) {
    return (
      <div className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
        This packet does not have a research revision yet.
      </div>
    );
  }

  const reviewable = packet.state === "awaiting_review";
  const failed = packet.state === "research_failed" || packet.state === "draft_failed";

  return (
    <article className="min-w-0">
      <header className="pb-5 mb-6" style={{ borderBottom: "1px solid var(--border-ghost)" }}>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[10px] font-semibold tracking-[0.14em] uppercase px-2 py-1" style={{ color: "var(--brand-cyan)", background: "color-mix(in srgb, var(--brand-cyan) 9%, transparent)" }}>
            {packet.cluster?.pillar || "DARQ"}
          </span>
          <span className="text-[10px] tracking-[0.12em] uppercase" style={{ color: "var(--text-muted)" }}>
            {stateLabels[packet.state]} · Revision {packet.current_revision} · v{packet.version}
          </span>
        </div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
          {packet.cluster?.topic_label || latest.core_claim}
        </h2>
      </header>

      {packet.safe_error_summary && (
        <div className="mb-6 px-4 py-3 text-sm" style={{ color: "#ff8080", background: "rgba(255,107,107,.08)", border: "1px solid rgba(255,107,107,.2)" }}>
          {packet.safe_error_summary}
        </div>
      )}
      {error && (
        <div role="alert" className="mb-6 px-4 py-3 text-sm" style={{ color: "#ff8080", background: "rgba(255,107,107,.08)", border: "1px solid rgba(255,107,107,.2)" }}>
          {error}
        </div>
      )}

      <div className="mb-8 pl-5 sm:pl-7 space-y-7" style={{ borderLeft: "2px solid var(--brand-cyan)" }}>
        <section>
          <p className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-2" style={{ color: "var(--brand-cyan)" }}>Claim</p>
          <p className="text-lg leading-relaxed" style={{ color: "var(--text-primary)" }}>{latest.core_claim}</p>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{latest.why_it_matters}</p>
        </section>
        <section>
          <p className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-2" style={{ color: "var(--text-muted)" }}>Evidence</p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{latest.evidence_summary}</p>
          <div className="mt-4 space-y-2">
            {latest.sources.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="block p-3 hover:opacity-80" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-ghost)" }}>
                <span className="block text-sm font-medium" style={{ color: "var(--text-primary)" }}>{source.title}</span>
                <span className="block mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>Tier {source.source_tier} · {source.source_name} · {source.supports}</span>
              </a>
            ))}
          </div>
        </section>
        <section>
          <div className="flex items-center gap-3 mb-2">
            <p className="text-[10px] font-semibold tracking-[0.15em] uppercase" style={{ color: "#ffb86b" }}>Uncertainty</p>
            <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{latest.confidence} confidence</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{latest.uncertainty}</p>
          {latest.conflicting_evidence.length > 0 && (
            <ul className="mt-3 list-disc pl-4 text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
              {latest.conflicting_evidence.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
        </section>
      </div>

      {latest.open_questions.length > 0 && (
        <section className="mb-8">
          <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-3" style={{ color: "var(--text-muted)" }}>Open questions</h3>
          <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            {latest.open_questions.map((question) => <li key={question}>— {question}</li>)}
          </ul>
        </section>
      )}

      <section className="mb-8 p-4 sm:p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-ghost)" }}>
        <label htmlFor="research-angle" className="block text-[10px] font-semibold tracking-[0.15em] uppercase mb-2" style={{ color: "var(--text-muted)" }}>Proposed angle</label>
        <textarea id="research-angle" aria-label="Proposed angle" value={angle} disabled={!reviewable || Boolean(busy)} onChange={(event) => setAngle(event.target.value)} rows={3} className="w-full p-3 text-sm resize-y" style={{ color: "var(--text-primary)", background: "var(--bg-secondary)", border: "1px solid var(--border-ghost)" }} />
        {reviewable && (
          <button type="button" onClick={() => act("edit_angle")} disabled={Boolean(busy)} className="mt-2 px-3 py-2 text-xs font-semibold" style={{ color: "var(--text-primary)", border: "1px solid var(--border-ghost)" }}>
            {busy === "edit_angle" ? "Saving…" : "Save angle"}
          </button>
        )}
      </section>

      {reviewable && (
        <section className="mb-8 space-y-3">
          <textarea aria-label="More research feedback" value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={3} placeholder="What needs another look?" className="w-full p-3 text-sm" style={{ color: "var(--text-primary)", background: "var(--bg-card)", border: "1px solid var(--border-ghost)" }} />
          <input aria-label="Rejection reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Optional rejection reason" className="w-full p-3 text-sm" style={{ color: "var(--text-primary)", background: "var(--bg-card)", border: "1px solid var(--border-ghost)" }} />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => act("approve")} disabled={Boolean(busy)} className="btn-glow px-4 py-2.5 text-sm font-semibold" style={{ background: "var(--brand-cyan)", color: "#0e0e0e", opacity: busy ? .65 : 1 }}>
              {busy === "approve" ? "Starting draft…" : "Approve research"}
            </button>
            <button type="button" onClick={() => act("request_more_research")} disabled={Boolean(busy)} className="px-4 py-2.5 text-sm font-semibold" style={{ color: "var(--text-primary)", border: "1px solid var(--border-ghost)" }}>
              {busy === "request_more_research" ? "Starting research…" : "Request more research"}
            </button>
            <button type="button" onClick={() => act("reject")} disabled={Boolean(busy)} className="px-4 py-2.5 text-sm" style={{ color: "#ff8080", border: "1px solid rgba(255,107,107,.25)" }}>Reject</button>
          </div>
        </section>
      )}

      {failed && (
        <button type="button" onClick={() => act("retry")} disabled={Boolean(busy)} className="mb-8 px-4 py-2.5 text-sm font-semibold" style={{ background: "var(--brand-cyan)", color: "#0e0e0e" }}>
          {busy === "retry" ? "Retrying…" : packet.state === "draft_failed" ? "Retry draft" : "Retry research"}
        </button>
      )}

      {packet.draft_url && (
        <a href={packet.draft_url} className="inline-block mb-8 text-sm font-semibold underline underline-offset-4" style={{ color: "var(--brand-cyan)" }}>Open draft</a>
      )}

      <section>
        <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-3" style={{ color: "var(--text-muted)" }}>History</h3>
        <div className="space-y-2">
          {packet.revisions.map((revision) => (
            <div key={revision.id} className="text-xs py-2" style={{ borderBottom: "1px solid var(--border-ghost)", color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>Revision {revision.revision}</strong> · {new Date(revision.researched_at).toLocaleString()}
            </div>
          ))}
          {packet.events.map((event) => (
            <div key={event.id} className="text-xs py-2 flex justify-between gap-4" style={{ borderBottom: "1px solid var(--border-ghost)", color: "var(--text-secondary)" }}>
              <span>{event.action.replaceAll("_", " ")} · {event.origin}</span>
              <time className="shrink-0" style={{ color: "var(--text-muted)" }}>{new Date(event.created_at).toLocaleString()}</time>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
