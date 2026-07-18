import { type NextRequest } from "next/server";

import { checkAdminAuth, unauthorized } from "@/lib/adminAuth";
import {
  PacketActionValidationError,
  startFocusedResearch,
} from "@/lib/research/actions";
import { researchErrorResponse } from "@/lib/research/http";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ clusterId: string }> },
) {
  if (!checkAdminAuth(request)) return unauthorized();
  try {
    const { clusterId } = await context.params;
    const value = await request.json() as Record<string, unknown>;
    if (typeof value.idempotencyKey !== "string" || !value.idempotencyKey.trim()) {
      throw new PacketActionValidationError("An idempotency key is required");
    }
    if (value.direction !== undefined && typeof value.direction !== "string") {
      throw new PacketActionValidationError("Research direction must be text");
    }
    const result = await startFocusedResearch({
      clusterId,
      direction: typeof value.direction === "string" ? value.direction : "",
      idempotencyKey: value.idempotencyKey,
      origin: "darqera",
      actorId: "noel",
    });
    return Response.json({ packet: result }, { status: result.replayed ? 200 : 202 });
  } catch (error) {
    return researchErrorResponse(error);
  }
}
