import type { PacketAction, PacketState } from "./types";

const transitionPolicy: Record<PacketState, Partial<Record<PacketAction, PacketState>>> = {
  researching: {
    research_completed: "awaiting_review",
    research_failed: "research_failed",
  },
  awaiting_review: {
    approve: "approved",
    request_more_research: "more_research_requested",
    reject: "rejected",
  },
  more_research_requested: {
    research_started: "researching",
    research_dispatch_failed: "research_failed",
  },
  approved: {
    draft_started: "drafting",
    draft_dispatch_failed: "draft_failed",
  },
  drafting: {
    draft_completed: "draft_ready",
    draft_failed: "draft_failed",
  },
  draft_ready: {},
  rejected: {},
  research_failed: { research_started: "researching" },
  draft_failed: { draft_started: "drafting" },
};

export class InvalidPacketTransitionError extends Error {
  constructor(current: PacketState, action: PacketAction) {
    super(`Action ${action} is not allowed from ${current}`);
    this.name = "InvalidPacketTransitionError";
  }
}

export function assertTransition(
  current: PacketState,
  action: PacketAction,
): PacketState {
  const next = transitionPolicy[current][action];
  if (!next) {
    throw new InvalidPacketTransitionError(current, action);
  }
  return next;
}

export function canEditAngle(state: PacketState): boolean {
  return state === "awaiting_review";
}
