import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listEligibleClusters: vi.fn(),
  getEligibleCluster: vi.fn(),
  startFocusedResearch: vi.fn(),
}));

vi.mock("@/lib/research/store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/research/store")>()),
  listEligibleClusters: mocks.listEligibleClusters,
  getEligibleCluster: mocks.getEligibleCluster,
}));

vi.mock("@/lib/research/actions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/research/actions")>()),
  startFocusedResearch: mocks.startFocusedResearch,
}));

import { GET as listClusters } from "./route";
import { GET as getCluster } from "./[clusterId]/route";
import { POST as startCluster } from "./[clusterId]/start/route";

const headers = { "x-admin-key": "admin-test-key" };

describe("cluster admin routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_SECRET_KEY = "admin-test-key";
  });

  it("requires admin authentication", async () => {
    const response = await listClusters(new NextRequest("http://localhost/api/admin/research/clusters"));
    expect(response.status).toBe(401);
  });

  it("returns eligible clusters and selected detail", async () => {
    mocks.listEligibleClusters.mockResolvedValue([{ cluster_id: "c1" }]);
    mocks.getEligibleCluster.mockResolvedValue({ cluster_id: "c1", sources: [] });

    const listResponse = await listClusters(new NextRequest("http://localhost/api/admin/research/clusters", { headers }));
    const detailResponse = await getCluster(
      new NextRequest("http://localhost/api/admin/research/clusters/c1", { headers }),
      { params: Promise.resolve({ clusterId: "c1" }) },
    );

    expect(await listResponse.json()).toEqual({ clusters: [{ cluster_id: "c1" }] });
    expect(await detailResponse.json()).toEqual({ cluster: { cluster_id: "c1", sources: [] } });
  });

  it("rejects a blank idempotency key", async () => {
    const response = await startCluster(
      new NextRequest("http://localhost/api/admin/research/clusters/c1/start", {
        method: "POST", headers, body: JSON.stringify({ direction: "Focus", idempotencyKey: " " }),
      }),
      { params: Promise.resolve({ clusterId: "c1" }) },
    );
    expect(response.status).toBe(400);
    expect(mocks.startFocusedResearch).not.toHaveBeenCalled();
  });

  it("starts one focused research job", async () => {
    mocks.startFocusedResearch.mockResolvedValue({ packetId: "p1", state: "researching", replayed: false });
    const response = await startCluster(
      new NextRequest("http://localhost/api/admin/research/clusters/c1/start", {
        method: "POST", headers, body: JSON.stringify({ direction: "Focus", idempotencyKey: "start-c1" }),
      }),
      { params: Promise.resolve({ clusterId: "c1" }) },
    );
    expect(response.status).toBe(202);
    expect(mocks.startFocusedResearch).toHaveBeenCalledWith(expect.objectContaining({
      clusterId: "c1", direction: "Focus", idempotencyKey: "start-c1",
    }));
  });
});
