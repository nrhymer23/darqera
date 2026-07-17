import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: { from: mocks.from } }));

import { POST } from "./route";

function request(payload: Record<string, unknown>) {
  return new Request("https://darqera.com/api/webhooks/signal", {
    method: "POST",
    headers: { "content-type": "application/json", "x-admin-key": "admin-secret" },
    body: JSON.stringify(payload),
  });
}

function dedupe(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

function insert(data: unknown) {
  return {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

const base = {
  title: "Durable agents",
  pillar: "A",
  content: "<h2>Hook</h2><p>Draft body</p>",
};

describe("signal webhook snapshot path", () => {
  beforeEach(() => {
    process.env.ADMIN_SECRET_KEY = "admin-secret";
    mocks.from.mockReset();
  });

  afterEach(() => {
    delete process.env.ADMIN_SECRET_KEY;
  });

  it("creates an unpublished post tagged by approval snapshot", async () => {
    const dedupeQuery = dedupe(null);
    const insertQuery = insert({ id: "post-1", slug: "durable-agents", status: "draft" });
    mocks.from.mockReturnValueOnce(dedupeQuery).mockReturnValueOnce(insertQuery);
    const response = await POST(request({ ...base, snapshotId: "s1", clusterId: "c1" }) as never);
    expect(response.status).toBe(201);
    expect(dedupeQuery.contains).toHaveBeenCalledWith("tags", ["snapshot:s1"]);
    expect(insertQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
      status: "draft",
      tags: expect.arrayContaining(["snapshot:s1", "cluster:c1"]),
    }));
    await expect(response.json()).resolves.toMatchObject({ status: "draft", duplicate: false });
  });

  it("returns the existing draft for a repeated snapshot", async () => {
    mocks.from.mockReturnValueOnce(dedupe({ id: "post-1", slug: "durable-agents" }));
    const response = await POST(request({ ...base, snapshotId: "s1" }) as never);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: "draft", duplicate: true });
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });

  it("retains legacy cluster deduplication", async () => {
    const query = dedupe({ id: "post-legacy", slug: "legacy" });
    mocks.from.mockReturnValueOnce(query);
    const response = await POST(request({ ...base, clusterId: "c1" }) as never);
    expect(query.contains).toHaveBeenCalledWith("tags", ["cluster:c1"]);
    expect(response.status).toBe(200);
  });

  it("rejects payloads without a snapshot or legacy cluster identifier", async () => {
    const response = await POST(request(base) as never);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing required identifier (snapshotId or clusterId)",
    });
  });
});
