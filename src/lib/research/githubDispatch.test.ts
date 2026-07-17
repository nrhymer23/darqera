import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  GitHubDispatchError,
  dispatchDraft,
  dispatchResearch,
} from "./githubDispatch";

describe("focused GitHub workflow dispatch", () => {
  beforeEach(() => {
    process.env.DARQ_PIPELINE_GITHUB_TOKEN = "github-secret-token";
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    delete process.env.DARQ_PIPELINE_GITHUB_TOKEN;
    vi.unstubAllGlobals();
  });

  it("dispatches a focused research revision on master", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    await expect(dispatchResearch({
      packetId: "p1",
      feedback: "Verify adoption",
      idempotencyKey: "research-1",
    })).resolves.toEqual({ accepted: true });

    expect(fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/nrhymer23/darq-signal-pipeline/actions/workflows/research-packet.yml/dispatches",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        headers: expect.objectContaining({
          Authorization: "Bearer github-secret-token",
          Accept: "application/vnd.github+json",
        }),
        body: JSON.stringify({
          ref: "master",
          inputs: {
            packet_id: "p1",
            feedback: "Verify adoption",
            idempotency_key: "research-1",
          },
        }),
      }),
    );
  });

  it("dispatches an approved snapshot exactly once by caller key", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    await dispatchDraft({ snapshotId: "s1", idempotencyKey: "draft-1" });
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toEqual({
      ref: "master",
      inputs: { snapshot_id: "s1", idempotency_key: "draft-1" },
    });
  });

  it("maps rate limits to a safe retryable error without response details", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("token github-secret-token exhausted", {
      status: 429,
    }));
    await expect(dispatchDraft({ snapshotId: "s1", idempotencyKey: "draft-1" }))
      .rejects.toEqual(expect.objectContaining({
        name: GitHubDispatchError.name,
        message: "Workflow dispatch is temporarily unavailable",
        retryable: true,
      }));
  });

  it("fails closed when the server token is missing", async () => {
    delete process.env.DARQ_PIPELINE_GITHUB_TOKEN;
    await expect(dispatchDraft({ snapshotId: "s1", idempotencyKey: "draft-1" }))
      .rejects.toBeInstanceOf(GitHubDispatchError);
    expect(fetch).not.toHaveBeenCalled();
  });
});
