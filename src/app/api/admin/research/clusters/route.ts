import { type NextRequest } from "next/server";

import { checkAdminAuth, unauthorized } from "@/lib/adminAuth";
import { researchErrorResponse } from "@/lib/research/http";
import { listEligibleClusters } from "@/lib/research/store";

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorized();
  try {
    return Response.json({ clusters: await listEligibleClusters() });
  } catch (error) {
    return researchErrorResponse(error);
  }
}
