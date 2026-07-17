import { type NextRequest } from "next/server";

import { performPacketAction } from "@/lib/research/actions";
import { verifyAgenticRequest } from "@/lib/research/hmac";
import { parsePacketAction, researchErrorResponse } from "@/lib/research/http";

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/internal/research/[id]/actions">,
) {
  const rawBody = await request.text();
  if (!verifyAgenticRequest(request, rawBody).ok) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    const body = JSON.parse(rawBody) as unknown;
    const action = parsePacketAction(
      id,
      body,
      "agentic_os",
      request.headers.get("x-agentic-actor") || "agentic-os",
    );
    return Response.json({ result: await performPacketAction(action) });
  } catch (error) {
    return researchErrorResponse(error);
  }
}
