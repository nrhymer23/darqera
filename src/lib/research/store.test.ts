import { describe, expect, it, vi } from "vitest";

import {
  PacketConflictError,
  ResearchStoreError,
  approvePacket,
  getPacketDetail,
  listPackets,
  requestMoreResearch,
} from "./store";

function chain(result: unknown) {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "eq", "order", "range", "single", "maybeSingle", "insert", "update"]) {
    query[method] = vi.fn(() => query);
  }
  query.then = vi.fn((resolve) => Promise.resolve(result).then(resolve));
  return query;
}

function clientWith(options: {
  tables?: Record<string, ReturnType<typeof chain>[]>;
  rpc?: ReturnType<typeof vi.fn>;
}) {
  const queues = new Map(
    Object.entries(options.tables ?? {}).map(([name, values]) => [name, [...values]]),
  );
  return {
    from: vi.fn((name: string) => {
      const queue = queues.get(name) ?? [];
      const next = queue.shift();
      if (!next) throw new Error(`Unexpected table call: ${name}`);
      return next;
    }),
    rpc: options.rpc ?? vi.fn(),
  };
}

describe("listPackets", () => {
  it("applies state, pillar, and pagination filters", async () => {
    const packets = [{ id: "p1", state: "awaiting_review" }];
    const query = chain({ data: packets, count: 31, error: null });
    const client = clientWith({ tables: { darq_research_packets: [query] } });

    const result = await listPackets(
      { state: "awaiting_review", pillar: "AI", page: 2, pageSize: 10 },
      client,
    );

    expect(query.eq).toHaveBeenCalledWith("state", "awaiting_review");
    expect(query.eq).toHaveBeenCalledWith("cluster.pillar", "AI");
    expect(query.range).toHaveBeenCalledWith(10, 19);
    expect(result).toMatchObject({ packets, total: 31, page: 2, pageSize: 10 });
  });
});

describe("getPacketDetail", () => {
  it("joins revisions, events, and the immutable approval snapshot", async () => {
    const packet = { id: "p1", state: "approved" };
    const client = clientWith({
      tables: {
        darq_research_packets: [chain({ data: packet, error: null })],
        darq_research_packet_revisions: [chain({ data: [{ revision: 2 }], error: null })],
        darq_research_events: [chain({ data: [{ action: "approved" }], error: null })],
        darq_approval_snapshots: [chain({ data: { id: "s1" }, error: null })],
      },
    });

    const detail = await getPacketDetail("p1", client);
    expect(detail).toMatchObject({
      id: "p1",
      revisions: [{ revision: 2 }],
      events: [{ action: "approved" }],
      approval_snapshot: { id: "s1" },
    });
  });
});

describe("packet mutations", () => {
  it("passes expected state/version to atomic approval and returns its snapshot", async () => {
    const idempotency = chain({ data: null, error: null });
    const reservation = chain({ data: { id: "i1" }, error: null });
    const finish = chain({ data: null, error: null });
    const rpc = vi.fn(() => chain({
      data: [{ packet_id: "p1", snapshot_id: "s1", state: "approved", version: 8 }],
      error: null,
    }));
    const client = clientWith({
      tables: { darq_action_idempotency: [idempotency, reservation, finish] },
      rpc,
    });

    const result = await approvePacket({
      packetId: "p1",
      expectedState: "awaiting_review",
      expectedVersion: 7,
      angle: "Approved angle",
      reviewerId: "noel",
      origin: "darqera",
      idempotencyKey: "approve-1",
    }, client);

    expect(rpc).toHaveBeenCalledWith("approve_research_packet", expect.objectContaining({
      p_expected_state: "awaiting_review",
      p_expected_version: 7,
      p_approved_angle: "Approved angle",
    }));
    expect(result).toMatchObject({ snapshotId: "s1", replayed: false });
  });

  it("returns a completed idempotent replay without calling the RPC", async () => {
    const stored = { snapshotId: "s1", state: "approved", version: 8 };
    const client = clientWith({
      tables: { darq_action_idempotency: [chain({ data: { result: stored }, error: null })] },
      rpc: vi.fn(),
    });
    const result = await approvePacket({
      packetId: "p1", expectedState: "awaiting_review", expectedVersion: 7,
      angle: "Angle", reviewerId: "noel", origin: "darqera", idempotencyKey: "approve-1",
    }, client);
    expect(client.rpc).not.toHaveBeenCalled();
    expect(result).toEqual({ ...stored, replayed: true });
  });

  it("maps PostgreSQL serialization failures to PacketConflictError", async () => {
    const rpc = vi.fn(() => chain({ data: null, error: { code: "40001", message: "raw detail" } }));
    const client = clientWith({
      tables: {
        darq_action_idempotency: [
          chain({ data: null, error: null }),
          chain({ data: { id: "i1" }, error: null }),
        ],
      },
      rpc,
    });
    await expect(requestMoreResearch({
      packetId: "p1", expectedState: "awaiting_review", expectedVersion: 3,
      feedback: "Verify adoption", actorId: "noel", origin: "darqera",
      idempotencyKey: "research-1",
    }, client)).rejects.toBeInstanceOf(PacketConflictError);
  });

  it("redacts unexpected database errors", async () => {
    const client = clientWith({
      tables: { darq_research_packets: [chain({ data: null, error: { message: "service-role secret" } })] },
    });
    await expect(listPackets({}, client)).rejects.toMatchObject({
      name: ResearchStoreError.name,
      message: "Research data is temporarily unavailable",
    });
  });
});
