"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { EligibleClusterDetail, EligibleClusterSummary } from "@/lib/research/types";

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function createIdempotencyKey(clusterId: string) {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  return `start-${clusterId}-${Date.now()}-${suffix}`;
}

export function ClusterPicker({ adminKey, onStarted }: { adminKey: string; onStarted: () => void | Promise<void> }) {
  const [clusters, setClusters] = useState<EligibleClusterSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<EligibleClusterDetail | null>(null);
  const [direction, setDirection] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const headers = useMemo(() => ({ "x-admin-key": adminKey }), [adminKey]);

  const loadClusters = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/research/clusters", { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load validated signals");
      setClusters(data.clusters || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load validated signals");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { void loadClusters(); }, [loadClusters]);

  async function selectCluster(clusterId: string) {
    setSelectedId(clusterId);
    setDetail(null);
    setDirection("");
    setDetailLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/research/clusters/${encodeURIComponent(clusterId)}`, { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load signal details");
      setDetail(data.cluster);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load signal details");
    } finally {
      setDetailLoading(false);
    }
  }

  async function startResearch() {
    if (!detail || starting) return;
    setStarting(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/research/clusters/${encodeURIComponent(detail.cluster_id)}/start`, {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({
          direction: direction.trim(),
          idempotencyKey: createIdempotencyKey(detail.cluster_id),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not start research");
      setSelectedId(null);
      setDetail(null);
      setDirection("");
      await loadClusters();
      await onStarted();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start research");
    } finally {
      setStarting(false);
    }
  }

  return (
    <section className="mb-10" aria-labelledby="choose-signal-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: "var(--brand-cyan)" }}>Editorial intake</p>
          <h3 id="choose-signal-title" className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Choose a signal</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Review the evidence cluster before opening a research packet.</p>
        </div>
        <button type="button" onClick={() => void loadClusters()} className="self-start px-3 py-2 text-xs" style={{ color: "var(--text-secondary)", border: "1px solid var(--border-ghost)" }}>Refresh signals</button>
      </div>

      {error && <div role="alert" className="mb-4 p-3 text-sm" style={{ color: "#ff8080", border: "1px solid rgba(255,107,107,.2)" }}>{error}</div>}

      <div className="grid lg:grid-cols-[minmax(15rem,0.72fr)_minmax(0,1.8fr)] gap-5 items-start">
        <aside className="max-h-[44rem] overflow-auto" style={{ border: "1px solid var(--border-ghost)", background: "var(--bg-card)" }}>
          {loading && clusters.length === 0 ? (
            <p className="p-5 text-sm" style={{ color: "var(--text-muted)" }}>Loading validated signals…</p>
          ) : clusters.length === 0 ? (
            <p className="p-5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>No validated signals are waiting for research.</p>
          ) : clusters.map((cluster) => (
            <button key={cluster.cluster_id} type="button" onClick={() => void selectCluster(cluster.cluster_id)} className="w-full text-left p-4 transition-colors" style={{ background: selectedId === cluster.cluster_id ? "var(--bg-secondary)" : "transparent", borderBottom: "1px solid var(--border-ghost)" }}>
              <span className="flex items-center justify-between gap-3 mb-2">
                <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--brand-cyan)" }}>{cluster.pillar}</span>
                <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{cluster.cluster_score ?? "—"}</span>
              </span>
              <span className="block text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>{cluster.topic_label}</span>
              <span className="block mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>{cluster.source_count} sources · {cluster.freshness_hours == null ? "Freshness unknown" : `${Math.round(cluster.freshness_hours)}h old`}</span>
            </button>
          ))}
        </aside>

        <div className="min-h-72" style={{ background: "var(--bg-card)", border: "1px solid var(--border-ghost)" }}>
          {detailLoading ? (
            <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>Opening signal dossier…</p>
          ) : !detail ? (
            <div className="py-16 px-6 text-center">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Select a signal to inspect its evidence and start focused research.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-[5px_minmax(0,1fr)]">
              <div aria-hidden="true" style={{ background: "var(--brand-cyan)" }} />
              <div className="p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="max-w-2xl">
                    <p className="text-[10px] uppercase tracking-[0.18em] mb-3" style={{ color: "var(--brand-cyan)" }}>{detail.pillar} signal dossier</p>
                    <h4 className="text-xl sm:text-2xl font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>{detail.topic_label}</h4>
                    {detail.summary && <p className="mt-4 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{detail.summary}</p>}
                  </div>
                  <div className="min-w-24 p-4 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-ghost)" }}>
                    <span className="block text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>Signal score</span>
                    <strong className="block mt-1 text-3xl font-mono font-medium" style={{ color: "var(--brand-cyan)" }}>{detail.cluster_score ?? "—"}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px my-6" style={{ background: "var(--border-ghost)", border: "1px solid var(--border-ghost)" }}>
                  {[
                    ["Sources", detail.source_count], ["Tier 1", detail.tier1_count], ["Tier 2", detail.tier2_count], ["Tier 3", detail.tier3_count],
                  ].map(([label, value]) => <div key={label} className="p-3" style={{ background: "var(--bg-card)" }}><span className="block text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</span><strong className="block mt-1 font-mono text-sm" style={{ color: "var(--text-primary)" }}>{value}</strong></div>)}
                </div>

                {Object.keys(detail.score_breakdown || {}).length > 0 && <div className="mb-7">
                  <h5 className="text-xs uppercase tracking-[0.14em] mb-3" style={{ color: "var(--text-secondary)" }}>Score breakdown</h5>
                  <div className="flex flex-wrap gap-2">{Object.entries(detail.score_breakdown).map(([label, value]) => <span key={label} className="px-3 py-2 text-xs" style={{ border: "1px solid var(--border-ghost)", color: "var(--text-secondary)" }}><span style={{ color: "var(--text-muted)" }}>{titleCase(label)}</span> <strong className="ml-2 font-mono" style={{ color: "var(--text-primary)" }}>{String(value)}</strong></span>)}</div>
                </div>}

                <div className="mb-7">
                  <h5 className="text-xs uppercase tracking-[0.14em] mb-3" style={{ color: "var(--text-secondary)" }}>Underlying sources</h5>
                  <div style={{ borderTop: "1px solid var(--border-ghost)" }}>
                    {detail.sources.map((source) => <article key={source.item_id} className="py-4" style={{ borderBottom: "1px solid var(--border-ghost)" }}>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2 text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
                        <span>{source.source_name}</span><span aria-hidden="true">·</span><span>{source.platform}</span><span aria-hidden="true">·</span><span>Tier {source.source_tier}</span><span aria-hidden="true">·</span><time>{formatDate(source.published_at)}</time>
                      </div>
                      <a href={source.source_url} target="_blank" rel="noreferrer" className="text-sm font-semibold hover:underline" style={{ color: "var(--text-primary)" }}>{source.title}</a>
                      <p className="mt-2 text-sm leading-6 line-clamp-3" style={{ color: "var(--text-secondary)" }}>{source.raw_text}</p>
                    </article>)}
                  </div>
                </div>

                <label htmlFor="research-direction" className="block text-xs uppercase tracking-[0.14em] mb-2" style={{ color: "var(--text-secondary)" }}>Research direction <span className="normal-case tracking-normal" style={{ color: "var(--text-muted)" }}>(optional)</span></label>
                <textarea id="research-direction" value={direction} onChange={(event) => setDirection(event.target.value)} rows={3} placeholder="What should the researcher validate, challenge, or prioritize?" className="w-full p-3 text-sm resize-y" style={{ color: "var(--text-primary)", background: "var(--bg-secondary)", border: "1px solid var(--border-ghost)" }} />
                <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Creates one canonical packet, then dispatches the research workflow.</p>
                  <button type="button" onClick={() => void startResearch()} disabled={starting} className="px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ color: "var(--bg-primary)", background: "var(--brand-cyan)" }}>{starting ? "Starting research…" : "Start research"}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
