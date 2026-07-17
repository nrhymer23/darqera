import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  approvePacket: vi.fn(),
  editAngle: vi.fn(),
  getPacketDetail: vi.fn(),
  markDispatchAccepted: vi.fn(),
  markDispatchFailed: vi.fn(),
  rejectPacket: vi.fn(),
  requestMoreResearch: vi.fn(),
  dispatchDraft: vi.fn(),
  dispatchResearch: vi.fn(),
}));

vi.mock("./store", () => ({
  PacketConflictError: class PacketConflictError extends Error {},
  approvePacket: mocks.approvePacket,
  editAngle: mocks.editAngle,
  getPacketDetail: mocks.getPacketDetail,
  markDispatchAccepted: mocks.markDispatchAccepted,
  markDispatchFailed: mocks.markDispatchFailed,
  rejectPacket: mocks.rejectPacket,
  requestMoreResearch: mocks.requestMoreResearch,
}));

vi.mock("./githubDispatch", () => ({
  dispatchDraft: mocks.dispatchDraft,
  dispatchResearch: mocks.dispatchResearch,
}));

import { PacketActionValidationError, performPacketAction } from "./actions";

const base = {
  packetId: "p1",
  expectedState: "awaiting_review" as const,
  expectedVersion: 4,
  idempotencyKey: "action-1",
  origin: "darqera" as const,
  actorId: "noel",
};

describe("performPacketAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dispatchDraft.mockResolvedValue({ accepted: true });
    mocks.dispatchResearch.mockResolvedValue({ accepted: true });
    mocks.markDispatchAccepted.mockResolvedValue({ state: "drafting", version: 6 });
    mocks.markDispatchFailed.mockResolvedValue({ state: "draft_failed", version: 6 });
  });

  it("approves, dispatches the immutable snapshot, and marks drafting", async () => {
    mocks.approvePacket.mockResolvedValue({ snapshotId: "s1", state: "approved", version: 5, replayed: false });
    const result = await performPacketAction({ ...base, action: "approve", angle: "Approved angle" });
    expect(mocks.approvePacket).toHaveBeenCalledWith(expect.objectContaining({ angle: "Approved angle" }));
    expect(mocks.dispatchDraft).toHaveBeenCalledWith({ snapshotId: "s1", idempotencyKey: "action-1" });
    expect(mocks.markDispatchAccepted).toHaveBeenCalledWith(expect.objectContaining({
      expectedState: "approved", expectedVersion: 5,
    }));
    expect(result).toMatchObject({ state: "drafting" });
  });

  it("requires feedback before requesting more research", async () => {
    await expect(performPacketAction({ ...base, action: "request_more_research", feedback: "  " }))
      .rejects.toBeInstanceOf(PacketActionValidationError);
    expect(mocks.requestMoreResearch).not.toHaveBeenCalled();
  });

  it("requests another pass and forwards editorial feedback", async () => {
    mocks.requestMoreResearch.mockResolvedValue({ state: "more_research_requested", version: 5, replayed: false });
    await performPacketAction({ ...base, action: "request_more_research", feedback: "Verify adoption" });
    expect(mocks.dispatchResearch).toHaveBeenCalledWith({
      packetId: "p1", feedback: "Verify adoption", idempotencyKey: "action-1",
    });
  });

  it("edits an angle without approving or dispatching", async () => {
    mocks.editAngle.mockResolvedValue({ state: "awaiting_review", version: 5 });
    await performPacketAction({ ...base, action: "edit_angle", angle: "New angle" });
    expect(mocks.editAngle).toHaveBeenCalled();
    expect(mocks.dispatchDraft).not.toHaveBeenCalled();
  });

  it("rejects without dispatching", async () => {
    mocks.rejectPacket.mockResolvedValue({ state: "rejected", version: 5 });
    await performPacketAction({ ...base, action: "reject", reason: "Not enough evidence" });
    expect(mocks.rejectPacket).toHaveBeenCalled();
    expect(mocks.dispatchDraft).not.toHaveBeenCalled();
    expect(mocks.dispatchResearch).not.toHaveBeenCalled();
  });

  it("retries a failed draft from its preserved snapshot", async () => {
    mocks.getPacketDetail.mockResolvedValue({ approval_snapshot: { id: "s1" } });
    mocks.markDispatchAccepted.mockResolvedValue({ state: "drafting", version: 9 });
    const result = await performPacketAction({
      ...base, action: "retry", expectedState: "draft_failed", expectedVersion: 8,
    });
    expect(mocks.dispatchDraft).toHaveBeenCalledWith({ snapshotId: "s1", idempotencyKey: "action-1" });
    expect(result).toMatchObject({ state: "drafting" });
  });

  it("records a safe failed state when dispatch is rejected", async () => {
    mocks.approvePacket.mockResolvedValue({ snapshotId: "s1", state: "approved", version: 5, replayed: false });
    mocks.dispatchDraft.mockRejectedValue(new Error("github raw response"));
    await expect(performPacketAction({ ...base, action: "approve", angle: "Angle" })).rejects.toThrow(
      "The draft job could not be started",
    );
    expect(mocks.markDispatchFailed).toHaveBeenCalledWith(expect.objectContaining({
      expectedState: "approved", expectedVersion: 5,
    }));
  });

  it("does not dispatch a completed idempotent replay twice", async () => {
    mocks.approvePacket.mockResolvedValue({ snapshotId: "s1", state: "drafting", version: 6, replayed: true });
    const result = await performPacketAction({ ...base, action: "approve", angle: "Angle" });
    expect(mocks.dispatchDraft).not.toHaveBeenCalled();
    expect(result).toMatchObject({ replayed: true });
  });
});
