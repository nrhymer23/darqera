import { dispatchDraft, dispatchResearch } from "./githubDispatch";
import {
  approvePacket,
  editAngle,
  getPacketDetail,
  markDispatchAccepted,
  markDispatchFailed,
  rejectPacket,
  requestMoreResearch,
  startClusterResearch,
} from "./store";
import type { PacketState, ReviewOrigin } from "./types";

type ReviewAction =
  | "approve"
  | "reject"
  | "request_more_research"
  | "edit_angle"
  | "retry";

export interface PacketActionInput {
  packetId: string;
  action: ReviewAction;
  expectedState: PacketState;
  expectedVersion: number;
  idempotencyKey: string;
  origin: Exclude<ReviewOrigin, "pipeline">;
  actorId: string;
  angle?: string;
  feedback?: string;
  reason?: string;
}

export class PacketActionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PacketActionValidationError";
  }
}

export class PacketDispatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PacketDispatchError";
  }
}

export interface StartFocusedResearchInput {
  clusterId: string;
  direction: string;
  idempotencyKey: string;
  origin: Exclude<ReviewOrigin, "pipeline">;
  actorId: string;
}

export async function startFocusedResearch(input: StartFocusedResearchInput) {
  const clusterId = requiredText(input.clusterId, "A signal cluster is required");
  const idempotencyKey = requiredText(input.idempotencyKey, "An idempotency key is required");
  const direction = input.direction.trim();
  const started = await startClusterResearch({
    ...input,
    clusterId,
    direction,
    idempotencyKey,
  });
  if (started.replayed) return started;
  try {
    await dispatchResearch({
      packetId: started.packetId,
      feedback: direction,
      idempotencyKey,
    });
    return started;
  } catch {
    await markDispatchFailed({
      packetId: started.packetId,
      expectedState: "researching",
      expectedVersion: started.version,
      actorId: input.actorId,
      origin: input.origin,
      idempotencyKey: `${idempotencyKey}:dispatch-failed`,
    });
    throw new PacketDispatchError("The research job could not be started");
  }
}

function requiredText(value: string | undefined, message: string): string {
  const clean = value?.trim();
  if (!clean) throw new PacketActionValidationError(message);
  return clean;
}

function transitionInput(
  input: PacketActionInput,
  state: PacketState,
  version: number,
  suffix: string,
) {
  return {
    packetId: input.packetId,
    expectedState: state,
    expectedVersion: version,
    actorId: input.actorId,
    origin: input.origin,
    idempotencyKey: `${input.idempotencyKey}:${suffix}`,
  };
}

export async function performPacketAction(input: PacketActionInput) {
  if (!input.idempotencyKey.trim()) {
    throw new PacketActionValidationError("An idempotency key is required");
  }

  const base = {
    packetId: input.packetId,
    expectedState: input.expectedState,
    expectedVersion: input.expectedVersion,
    actorId: input.actorId,
    origin: input.origin,
    idempotencyKey: input.idempotencyKey,
  };

  if (input.action === "edit_angle") {
    return editAngle({
      ...base,
      angle: requiredText(input.angle, "A proposed angle is required"),
    });
  }

  if (input.action === "reject") {
    return rejectPacket({ ...base, reason: input.reason?.trim() || undefined });
  }

  if (input.action === "approve") {
    const approved = await approvePacket({
      ...base,
      angle: requiredText(input.angle, "An approved angle is required"),
      reviewerId: input.actorId,
    }) as {
      snapshotId: string;
      state: PacketState;
      version: number;
      replayed: boolean;
    };
    if (approved.replayed) return approved;
    const state = approved.state;
    const version = approved.version;
    try {
      await dispatchDraft({
        snapshotId: String(approved.snapshotId),
        idempotencyKey: input.idempotencyKey,
      });
      return markDispatchAccepted(
        transitionInput(input, state, version, "dispatch-accepted"),
      );
    } catch {
      await markDispatchFailed(
        transitionInput(input, state, version, "dispatch-failed"),
      );
      throw new PacketDispatchError("The draft job could not be started");
    }
  }

  if (input.action === "request_more_research") {
    const feedback = requiredText(
      input.feedback,
      "Tell the researcher what needs another look",
    );
    const requested = await requestMoreResearch({ ...base, feedback }) as {
      state: PacketState;
      version: number;
      replayed: boolean;
    };
    if (requested.replayed) return requested;
    const state = requested.state;
    const version = requested.version;
    try {
      await dispatchResearch({
        packetId: input.packetId,
        feedback,
        idempotencyKey: input.idempotencyKey,
      });
      return markDispatchAccepted(
        transitionInput(input, state, version, "dispatch-accepted"),
      );
    } catch {
      await markDispatchFailed(
        transitionInput(input, state, version, "dispatch-failed"),
      );
      throw new PacketDispatchError("The research job could not be started");
    }
  }

  if (input.action === "retry") {
    if (input.expectedState === "research_failed") {
      const feedback = input.feedback?.trim() || "Retry the failed research pass";
      await dispatchResearch({
        packetId: input.packetId,
        feedback,
        idempotencyKey: input.idempotencyKey,
      });
      return markDispatchAccepted(
        transitionInput(input, "research_failed", input.expectedVersion, "dispatch-accepted"),
      );
    }
    if (input.expectedState === "draft_failed") {
      const detail = await getPacketDetail(input.packetId);
      const snapshotId = detail.approval_snapshot?.id;
      if (!snapshotId) {
        throw new PacketActionValidationError("This packet has no approval snapshot to retry");
      }
      await dispatchDraft({ snapshotId, idempotencyKey: input.idempotencyKey });
      return markDispatchAccepted(
        transitionInput(input, "draft_failed", input.expectedVersion, "dispatch-accepted"),
      );
    }
    throw new PacketActionValidationError("Only failed jobs can be retried");
  }

  throw new PacketActionValidationError("Unknown research action");
}
