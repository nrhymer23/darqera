import { supabaseAdmin } from "@/lib/supabaseAdmin";

import type {
  PacketState,
  ResearchPacket,
  ResearchPacketDetail,
  ReviewOrigin,
} from "./types";

interface DbError {
  code?: string;
  message?: string;
}

interface QueryResult {
  data: unknown;
  error: DbError | null;
  count?: number | null;
}

interface QueryBuilder extends PromiseLike<QueryResult> {
  select(columns?: string, options?: Record<string, unknown>): QueryBuilder;
  eq(column: string, value: unknown): QueryBuilder;
  order(column: string, options?: Record<string, unknown>): QueryBuilder;
  range(from: number, to: number): QueryBuilder;
  single(): QueryBuilder;
  maybeSingle(): QueryBuilder;
  insert(values: unknown): QueryBuilder;
  update(values: unknown): QueryBuilder;
}

export interface ResearchDb {
  from(table: string): QueryBuilder;
  rpc(name: string, args: Record<string, unknown>): QueryBuilder;
}

export class ResearchStoreError extends Error {
  constructor(message = "Research data is temporarily unavailable") {
    super(message);
    this.name = "ResearchStoreError";
  }
}

export class PacketConflictError extends Error {
  constructor(message = "This research packet changed. Refresh and try again.") {
    super(message);
    this.name = "PacketConflictError";
  }
}

function dbOrThrow(client?: ResearchDb): ResearchDb {
  if (client) return client;
  if (!supabaseAdmin) throw new ResearchStoreError();
  return supabaseAdmin as unknown as ResearchDb;
}

function throwSafe(error: DbError | null): void {
  if (!error) return;
  if (error.code === "40001" || error.code === "23505") {
    throw new PacketConflictError();
  }
  throw new ResearchStoreError();
}

export interface PacketListFilters {
  state?: PacketState;
  pillar?: "AI" | "Decentralized" | "Reality" | "Quantum";
  page?: number;
  pageSize?: number;
}

export async function listPackets(
  filters: PacketListFilters = {},
  client?: ResearchDb,
) {
  const db = dbOrThrow(client);
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const start = (page - 1) * pageSize;
  let query = db
    .from("darq_research_packets")
    .select("*, cluster:darq_signal_clusters!darq_research_packets_cluster_id_fkey(cluster_id,pillar,topic_label,cluster_score,source_count)", {
      count: "exact",
    })
    .order("updated_at", { ascending: false });
  if (filters.state) query = query.eq("state", filters.state);
  if (filters.pillar) query = query.eq("cluster.pillar", filters.pillar);
  const { data, error, count } = await query.range(start, start + pageSize - 1);
  throwSafe(error);
  return {
    packets: (data ?? []) as ResearchPacket[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getPacketDetail(
  packetId: string,
  client?: ResearchDb,
): Promise<ResearchPacketDetail> {
  const db = dbOrThrow(client);
  const packetResult = await db
    .from("darq_research_packets")
    .select("*, cluster:darq_signal_clusters!darq_research_packets_cluster_id_fkey(cluster_id,pillar,topic_label,cluster_score,source_count)")
    .eq("id", packetId)
    .single();
  throwSafe(packetResult.error);
  if (!packetResult.data) throw new ResearchStoreError("Research packet not found");

  const revisionResult = await db
    .from("darq_research_packet_revisions")
    .select("*")
    .eq("packet_id", packetId)
    .order("revision", { ascending: false });
  const eventResult = await db
    .from("darq_research_events")
    .select("*")
    .eq("packet_id", packetId)
    .order("created_at", { ascending: false });
  const snapshotResult = await db
    .from("darq_approval_snapshots")
    .select("*")
    .eq("packet_id", packetId)
    .maybeSingle();
  throwSafe(revisionResult.error);
  throwSafe(eventResult.error);
  throwSafe(snapshotResult.error);
  return {
    ...(packetResult.data as ResearchPacket),
    revisions: (revisionResult.data ?? []) as ResearchPacketDetail["revisions"],
    events: (eventResult.data ?? []) as ResearchPacketDetail["events"],
    approval_snapshot: (snapshotResult.data ?? null) as ResearchPacketDetail["approval_snapshot"],
  };
}

interface MutationBase {
  packetId: string;
  expectedState: PacketState;
  expectedVersion: number;
  actorId: string;
  origin: Exclude<ReviewOrigin, "pipeline">;
  idempotencyKey: string;
}

type StoredResult = Record<string, unknown>;

async function beginIdempotentAction(
  db: ResearchDb,
  input: MutationBase,
  action: string,
): Promise<StoredResult | null> {
  const existing = await db
    .from("darq_action_idempotency")
    .select("result,action,packet_id")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  throwSafe(existing.error);
  if (existing.data) {
    const row = existing.data as { result?: StoredResult | null };
    if (row.result) return row.result;
    throw new PacketConflictError("This action is already in progress.");
  }
  const reserved = await db
    .from("darq_action_idempotency")
    .insert({
      idempotency_key: input.idempotencyKey,
      packet_id: input.packetId,
      action,
      caller: input.origin,
    })
    .select("id")
    .single();
  throwSafe(reserved.error);
  return null;
}

async function finishIdempotentAction(
  db: ResearchDb,
  key: string,
  result: StoredResult,
): Promise<void> {
  const saved = await db
    .from("darq_action_idempotency")
    .update({ result })
    .eq("idempotency_key", key);
  throwSafe(saved.error);
}

function replay(result: StoredResult) {
  return { ...result, replayed: true };
}

export interface ApprovePacketInput extends MutationBase {
  angle: string;
  reviewerId: string;
}

export async function approvePacket(input: ApprovePacketInput, client?: ResearchDb) {
  const db = dbOrThrow(client);
  const existing = await beginIdempotentAction(db, input, "approve");
  if (existing) return replay(existing);
  const response = await db.rpc("approve_research_packet", {
    p_packet_id: input.packetId,
    p_expected_state: input.expectedState,
    p_expected_version: input.expectedVersion,
    p_approved_angle: input.angle,
    p_reviewer_id: input.reviewerId,
    p_origin: input.origin,
  });
  throwSafe(response.error);
  const row = (response.data as Array<Record<string, unknown>> | null)?.[0];
  if (!row) throw new ResearchStoreError();
  const result = {
    packetId: row.packet_id,
    snapshotId: row.snapshot_id,
    state: row.state,
    version: row.version,
  };
  await finishIdempotentAction(db, input.idempotencyKey, result);
  return { ...result, replayed: false };
}

interface TransitionInput extends MutationBase {
  feedback?: string;
  reason?: string;
}

async function transition(
  input: TransitionInput,
  action: string,
  newState: PacketState,
  client?: ResearchDb,
) {
  const db = dbOrThrow(client);
  const existing = await beginIdempotentAction(db, input, action);
  if (existing) return replay(existing);
  const response = await db.rpc("transition_research_packet", {
    p_packet_id: input.packetId,
    p_expected_state: input.expectedState,
    p_expected_version: input.expectedVersion,
    p_new_state: newState,
    p_action: action,
    p_origin: input.origin,
    p_feedback: input.feedback ?? input.reason ?? null,
    p_actor_id: input.actorId,
    p_metadata: {},
  });
  throwSafe(response.error);
  const row = (response.data as Array<Record<string, unknown>> | null)?.[0];
  if (!row) throw new ResearchStoreError();
  const result = { packetId: input.packetId, state: row.state, version: row.version };
  await finishIdempotentAction(db, input.idempotencyKey, result);
  return { ...result, replayed: false };
}

export function requestMoreResearch(input: TransitionInput, client?: ResearchDb) {
  return transition(input, "more_research_requested", "more_research_requested", client);
}

export function rejectPacket(input: TransitionInput, client?: ResearchDb) {
  return transition(input, "rejected", "rejected", client);
}

export async function editAngle(
  input: MutationBase & { angle: string },
  client?: ResearchDb,
) {
  const db = dbOrThrow(client);
  const existing = await beginIdempotentAction(db, input, "angle_edited");
  if (existing) return replay(existing);
  const response = await db.rpc("edit_research_packet_angle", {
    p_packet_id: input.packetId,
    p_expected_state: input.expectedState,
    p_expected_version: input.expectedVersion,
    p_angle: input.angle,
    p_actor_id: input.actorId,
    p_origin: input.origin,
  });
  throwSafe(response.error);
  const row = (response.data as Array<Record<string, unknown>> | null)?.[0];
  if (!row) throw new ResearchStoreError();
  const result = { packetId: input.packetId, state: row.state, version: row.version };
  await finishIdempotentAction(db, input.idempotencyKey, result);
  return { ...result, replayed: false };
}

export function markDispatchAccepted(input: TransitionInput, client?: ResearchDb) {
  const draft = input.expectedState === "approved" || input.expectedState === "draft_failed";
  return transition(
    input,
    draft ? "draft_started" : "research_started",
    draft ? "drafting" : "researching",
    client,
  );
}

export function markDispatchFailed(input: TransitionInput, client?: ResearchDb) {
  const draft = input.expectedState === "approved" || input.expectedState === "drafting";
  return transition(
    input,
    draft ? "draft_dispatch_failed" : "research_dispatch_failed",
    draft ? "draft_failed" : "research_failed",
    client,
  );
}
