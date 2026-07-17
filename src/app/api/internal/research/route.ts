import { type NextRequest } from "next/server";

import { verifyAgenticRequest } from "@/lib/research/hmac";
import { researchErrorResponse } from "@/lib/research/http";
import { listPackets } from "@/lib/research/store";
import type { PacketListFilters } from "@/lib/research/store";
import type { PacketState } from "@/lib/research/types";

export async function GET(request: NextRequest) {
  if (!verifyAgenticRequest(request, "").ok) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const state = request.nextUrl.searchParams.get("state") ?? undefined;
    const pillar = request.nextUrl.searchParams.get("pillar") ?? undefined;
    return Response.json(await listPackets({
      state: state as PacketState | undefined,
      pillar: pillar as PacketListFilters["pillar"],
      page: Number(request.nextUrl.searchParams.get("page") || 1),
      pageSize: Number(request.nextUrl.searchParams.get("pageSize") || 20),
    }));
  } catch (error) {
    return researchErrorResponse(error);
  }
}
