import { PacketActionValidationError, PacketDispatchError } from "./actions";
import { PacketConflictError, ResearchStoreError } from "./store";
import type { PacketActionInput } from "./actions";
import type { PacketState, ReviewOrigin } from "./types";

const ACTIONS = new Set(["approve", "reject", "request_more_research", "edit_angle", "retry"]);
const STATES = new Set<PacketState>([
  "researching", "awaiting_review", "more_research_requested", "approved",
  "drafting", "draft_ready", "rejected", "research_failed", "draft_failed",
]);

export function parsePacketAction(
  packetId: string,
  value: unknown,
  origin: Exclude<ReviewOrigin, "pipeline">,
  actorId: string,
): PacketActionInput {
  if (!value || typeof value !== "object") {
    throw new PacketActionValidationError("A JSON action body is required");
  }
  const body = value as Record<string, unknown>;
  if (typeof body.action !== "string" || !ACTIONS.has(body.action)) {
    throw new PacketActionValidationError("Unknown research action");
  }
  if (typeof body.expectedState !== "string" || !STATES.has(body.expectedState as PacketState)) {
    throw new PacketActionValidationError("A valid expected state is required");
  }
  if (!Number.isInteger(body.expectedVersion) || Number(body.expectedVersion) < 0) {
    throw new PacketActionValidationError("A valid expected version is required");
  }
  if (typeof body.idempotencyKey !== "string" || !body.idempotencyKey.trim()) {
    throw new PacketActionValidationError("An idempotency key is required");
  }
  return {
    packetId,
    action: body.action as PacketActionInput["action"],
    expectedState: body.expectedState as PacketState,
    expectedVersion: Number(body.expectedVersion),
    idempotencyKey: body.idempotencyKey,
    origin,
    actorId,
    angle: typeof body.angle === "string" ? body.angle : undefined,
    feedback: typeof body.feedback === "string" ? body.feedback : undefined,
    reason: typeof body.reason === "string" ? body.reason : undefined,
  };
}

export function researchErrorResponse(error: unknown): Response {
  if (error instanceof PacketActionValidationError) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof PacketConflictError) {
    return Response.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof PacketDispatchError) {
    return Response.json({ error: error.message }, { status: 502 });
  }
  if (error instanceof ResearchStoreError) {
    const status = error.message === "Research packet not found" ? 404 : 503;
    return Response.json({ error: error.message }, { status });
  }
  return Response.json({ error: "Research action failed" }, { status: 500 });
}
