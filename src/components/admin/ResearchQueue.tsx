"use client";

import { useCallback, useEffect, useState } from "react";

import { ResearchPacketDetail } from "./ResearchPacketDetail";
import type { PacketState, ResearchPacket, ResearchPacketDetail as PacketDetail } from "@/lib/research/types";

const states: Array<{ value: "" | PacketState; label: string }> = [
  { value: "", label: "All states" },
  { value: "awaiting_review", label: "Awaiting review" },
  { value: "researching", label: "Researching" },
  { value: "drafting", label: "Drafting" },
  { value: "draft_ready", label: "Draft ready" },
  { value: "research_failed", label: "Research failed" },
  { value: "draft_failed", label: "Draft failed" },
  { value: "rejected", label: "Rejected" },
];

export function ResearchQueue({ adminKey }: { adminKey: string }) {
  const [packets, setPackets] = useState<ResearchPacket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PacketDetail | null>(null);
  const [state, setState] = useState<"" | PacketState>("awaiting_review");
  const [pillar, setPillar] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const headers = useCallback(() => ({ "x-admin-key": adminKey }), [adminKey]);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (state) params.set("state", state);
      if (pillar) params.set("pillar", pillar);
      const response = await fetch(`/api/admin/research?${params}`, { headers: headers() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load research queue");
      setPackets(data.packets || []);
      setSelectedId((current) => current && data.packets?.some((item: ResearchPacket) => item.id === current)
        ? current
        : data.packets?.[0]?.id || null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load research queue");
    } finally {
      setLoading(false);
    }
  }, [headers, pillar, state]);

  const loadDetail = useCallback(async (id: string) => {
    setError("");
    try {
      const response = await fetch(`/api/admin/research/${id}`, { headers: headers() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load research packet");
      setDetail(data.packet);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load research packet");
    }
  }, [headers]);

  useEffect(() => { void loadQueue(); }, [loadQueue]);
  useEffect(() => { if (selectedId) void loadDetail(selectedId); else setDetail(null); }, [loadDetail, selectedId]);

  async function refresh() {
    await loadQueue();
    if (selectedId) await loadDetail(selectedId);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <select aria-label="Research state" value={state} onChange={(event) => setState(event.target.value as "" | PacketState)} className="px-3 py-2 text-sm" style={{ color: "var(--text-primary)", background: "var(--bg-card)", border: "1px solid var(--border-ghost)" }}>
          {states.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select aria-label="Research pillar" value={pillar} onChange={(event) => setPillar(event.target.value)} className="px-3 py-2 text-sm" style={{ color: "var(--text-primary)", background: "var(--bg-card)", border: "1px solid var(--border-ghost)" }}>
          <option value="">All pillars</option>
          <option value="Decentralized">Decentralization</option>
          <option value="AI">AI</option>
          <option value="Reality">Reality</option>
          <option value="Quantum">Quantum</option>
        </select>
        <button type="button" onClick={() => refresh()} className="sm:ml-auto px-3 py-2 text-xs" style={{ color: "var(--text-secondary)", border: "1px solid var(--border-ghost)" }}>Refresh canonical data</button>
      </div>

      {error && <div role="alert" className="mb-4 p-3 text-sm" style={{ color: "#ff8080", border: "1px solid rgba(255,107,107,.2)" }}>{error}</div>}

      <div className="grid lg:grid-cols-[minmax(15rem,0.72fr)_minmax(0,1.8fr)] gap-5 items-start">
        <aside className="lg:sticky lg:top-24 max-h-[72vh] overflow-auto" style={{ border: "1px solid var(--border-ghost)", background: "var(--bg-card)" }}>
          {loading && packets.length === 0 ? (
            <p className="p-5 text-sm" style={{ color: "var(--text-muted)" }}>Loading research…</p>
          ) : packets.length === 0 ? (
            <p className="p-5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>Nothing needs review in this view. Change a filter or wait for the next research pass.</p>
          ) : packets.map((packet) => (
            <button key={packet.id} type="button" onClick={() => setSelectedId(packet.id)} className="w-full text-left p-4" style={{ background: selectedId === packet.id ? "var(--bg-secondary)" : "transparent", borderBottom: "1px solid var(--border-ghost)" }}>
              <span className="block text-[10px] uppercase tracking-[0.12em] mb-2" style={{ color: packet.state === "awaiting_review" ? "var(--brand-cyan)" : "var(--text-muted)" }}>{packet.state.replaceAll("_", " ")}</span>
              <span className="block text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>{packet.cluster?.topic_label || packet.cluster_id}</span>
              <span className="block mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>{packet.cluster?.pillar} · Revision {packet.current_revision}</span>
            </button>
          ))}
        </aside>

        <main className="p-4 sm:p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-ghost)" }}>
          {detail ? <ResearchPacketDetail packet={detail} adminKey={adminKey} onRefresh={refresh} /> : <p className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>Select a research packet.</p>}
        </main>
      </div>
    </div>
  );
}
