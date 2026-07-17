// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ResearchPacketDetail } from "./ResearchPacketDetail";
import type { ResearchPacketDetail as PacketDetail } from "@/lib/research/types";

const packet: PacketDetail = {
  id: "p1", cluster_id: "c1", current_revision: 2, state: "awaiting_review",
  proposed_angle: "The move from chat to durable work", github_run_id: null,
  github_run_url: null, draft_url: null, safe_error_summary: null, version: 4,
  created_at: "2026-07-17T12:00:00Z", updated_at: "2026-07-17T13:00:00Z",
  cluster: { cluster_id: "c1", pillar: "AI", topic_label: "Durable agents", cluster_score: 82, source_count: 3 },
  revisions: [{
    id: "r2", packet_id: "p1", revision: 2, researched_at: "2026-07-17T13:00:00Z",
    created_at: "2026-07-17T13:00:00Z",
    packet: {
      core_claim: "Agents can run beyond a chat session",
      why_it_matters: "Longer delegation changes software work",
      evidence_summary: "Two primary sources describe durable execution",
      sources: [{ url: "https://example.com/research", title: "Durable agents", published_at: null, source_name: "Example Research", source_tier: 1, supports: "Durable execution" }],
      conflicting_evidence: ["Benchmarks remain narrow"], uncertainty: "Adoption is not yet measured",
      confidence: "medium", open_questions: ["How reliable are week-long runs?"],
      proposed_angle: "Old angle",
    },
  }],
  events: [{ id: "e1", packet_id: "p1", revision: 2, action: "research_completed", origin: "pipeline", feedback: null, actor_id: null, metadata: {}, created_at: "2026-07-17T13:00:00Z" }],
  approval_snapshot: null,
};

describe("ResearchPacketDetail", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the evidence spine, sources, uncertainty, questions, and history", () => {
    render(<ResearchPacketDetail packet={packet} adminKey="key" onRefresh={vi.fn()} />);
    expect(screen.getByText("Agents can run beyond a chat session")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Durable agents/ })).toHaveAttribute("href", "https://example.com/research");
    expect(screen.getByText("Adoption is not yet measured")).toBeInTheDocument();
    expect(screen.getByText(/How reliable are week-long runs\?/)).toBeInTheDocument();
    expect(screen.getByText(/research completed/)).toBeInTheDocument();
  });

  it("saves an edited angle without approving", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ result: { state: "awaiting_review", version: 5 } }), { status: 200 }));
    render(<ResearchPacketDetail packet={packet} adminKey="key" onRefresh={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Proposed angle"), { target: { value: "A sharper editorial angle" } });
    fireEvent.click(screen.getByRole("button", { name: "Save angle" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
    expect(body).toMatchObject({ action: "edit_angle", angle: "A sharper editorial angle" });
    expect(body.action).not.toBe("approve");
  });

  it("requires more-research feedback and disables duplicate approval", async () => {
    let release: ((value: Response) => void) | undefined;
    vi.mocked(fetch).mockImplementation(() => new Promise((resolve) => { release = resolve; }));
    render(<ResearchPacketDetail packet={packet} adminKey="key" onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Request more research" }));
    expect(screen.getByText("Tell the researcher what needs another look")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Approve research" }));
    fireEvent.click(screen.getByRole("button", { name: "Starting draft…" }));
    expect(fetch).toHaveBeenCalledTimes(1);
    release?.(new Response(JSON.stringify({ result: {} }), { status: 200 }));
  });

  it("shows safe errors, retry controls, revision history, and the draft link", () => {
    const failed: PacketDetail = {
      ...packet, state: "draft_failed", safe_error_summary: "Draft delivery failed",
      draft_url: "/admin?post=post-1",
    };
    render(<ResearchPacketDetail packet={failed} adminKey="key" onRefresh={vi.fn()} />);
    expect(screen.getByText("Draft delivery failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry draft" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open draft" })).toHaveAttribute("href", "/admin?post=post-1");
    expect(screen.getByText("Revision 2")).toBeInTheDocument();
  });
});
