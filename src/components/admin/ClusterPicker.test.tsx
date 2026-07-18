// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ClusterPicker } from "./ClusterPicker";

const cluster = {
  cluster_id: "cluster-ai-1",
  pillar: "AI",
  topic_label: "Durable agents move beyond chat",
  summary: "Long-running agents are becoming practical infrastructure.",
  source_count: 3,
  tier1_count: 2,
  tier2_count: 1,
  tier3_count: 0,
  freshness_hours: 5,
  cluster_score: 84,
  score_breakdown: { authority: 28, velocity: 22, relevance: 34 },
  source_urls: ["https://example.com/research"],
  item_ids: ["item-1"],
};

const detail = {
  ...cluster,
  sources: [{
    item_id: "item-1",
    source_url: "https://example.com/research",
    source_name: "Example Research",
    source_tier: 1,
    platform: "web",
    pillar: "AI",
    title: "Agents can now run for days",
    raw_text: "A primary-source account of durable execution and its current limits.",
    published_at: "2026-07-17T12:00:00Z",
    collected_at: "2026-07-17T13:00:00Z",
  }],
};

describe("ClusterPicker", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("loads eligible signals and opens the complete signal dossier", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ clusters: [cluster] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ cluster: detail }), { status: 200 }));

    render(<ClusterPicker adminKey="key" onStarted={vi.fn()} />);

    expect(await screen.findByRole("button", { name: /Durable agents move beyond chat/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Durable agents move beyond chat/ }));

    expect(await screen.findByText("Long-running agents are becoming practical infrastructure.")).toBeInTheDocument();
    expect(screen.getAllByText("84")).toHaveLength(2);
    expect(screen.getByText("Authority")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Agents can now run for days" })).toHaveAttribute("href", "https://example.com/research");
    expect(screen.getByText(/primary-source account/)).toBeInTheDocument();
  });

  it("starts research once with optional editorial direction and refreshes the queue", async () => {
    const onStarted = vi.fn();
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ clusters: [cluster] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ cluster: detail }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: { packetId: "packet-1", replayed: false } }), { status: 202 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ clusters: [] }), { status: 200 }));

    render(<ClusterPicker adminKey="key" onStarted={onStarted} />);
    fireEvent.click(await screen.findByRole("button", { name: /Durable agents move beyond chat/ }));
    await screen.findByRole("link", { name: "Agents can now run for days" });
    fireEvent.change(screen.getByLabelText(/Research direction/), { target: { value: "Validate the reliability claims and find counterevidence." } });
    fireEvent.click(screen.getByRole("button", { name: "Start research" }));

    await waitFor(() => expect(onStarted).toHaveBeenCalledTimes(1));
    const startCall = vi.mocked(fetch).mock.calls[2];
    expect(startCall[0]).toBe("/api/admin/research/clusters/cluster-ai-1/start");
    expect(startCall[1]?.headers).toMatchObject({ "x-admin-key": "key", "content-type": "application/json" });
    expect(JSON.parse(String(startCall[1]?.body))).toMatchObject({
      direction: "Validate the reliability claims and find counterevidence.",
    });
    expect(JSON.parse(String(startCall[1]?.body)).idempotencyKey).toMatch(/^start-cluster-ai-1-/);
    expect(screen.getByText("No validated signals are waiting for research.")).toBeInTheDocument();
  });
});
