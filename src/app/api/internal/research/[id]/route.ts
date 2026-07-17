import { type NextRequest } from "next/server";

import { verifyAgenticRequest } from "@/lib/research/hmac";
import { researchErrorResponse } from "@/lib/research/http";
import { getPacketDetail } from "@/lib/research/store";

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/internal/research/[id]">,
) {
  if (!verifyAgenticRequest(request, "").ok) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    return Response.json({ packet: await getPacketDetail(id) });
  } catch (error) {
    return researchErrorResponse(error);
  }
}
