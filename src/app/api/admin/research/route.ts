import { type NextRequest } from "next/server";

import { checkAdminAuth, unauthorized } from "@/lib/adminAuth";
import { researchErrorResponse } from "@/lib/research/http";
import { listPackets } from "@/lib/research/store";
import type { PacketListFilters } from "@/lib/research/store";
import type { PacketState } from "@/lib/research/types";

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorized();
  const state = request.nextUrl.searchParams.get("state") ?? undefined;
  const pillar = request.nextUrl.searchParams.get("pillar") ?? undefined;
  const filters: PacketListFilters = {
    state: state as PacketState | undefined,
    pillar: pillar as PacketListFilters["pillar"],
    page: Number(request.nextUrl.searchParams.get("page") || 1),
    pageSize: Number(request.nextUrl.searchParams.get("pageSize") || 20),
  };
  try {
    return Response.json(await listPackets(filters));
  } catch (error) {
    return researchErrorResponse(error);
  }
}
