import { type NextRequest } from "next/server";

import { checkAdminAuth, unauthorized } from "@/lib/adminAuth";
import { researchErrorResponse } from "@/lib/research/http";
import { getEligibleCluster } from "@/lib/research/store";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ clusterId: string }> },
) {
  if (!checkAdminAuth(request)) return unauthorized();
  try {
    const { clusterId } = await context.params;
    return Response.json({ cluster: await getEligibleCluster(clusterId) });
  } catch (error) {
    return researchErrorResponse(error);
  }
}
