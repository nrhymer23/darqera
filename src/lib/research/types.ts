export type PacketState =
  | "researching"
  | "awaiting_review"
  | "more_research_requested"
  | "approved"
  | "drafting"
  | "draft_ready"
  | "rejected"
  | "research_failed"
  | "draft_failed";

export type ReviewOrigin = "darqera" | "agentic_os" | "pipeline";

export type PacketAction =
  | "research_completed"
  | "research_failed"
  | "approve"
  | "request_more_research"
  | "reject"
  | "research_started"
  | "draft_started"
  | "draft_completed"
  | "draft_failed"
  | "research_dispatch_failed"
  | "draft_dispatch_failed";

export type ResearchConfidence = "low" | "medium" | "high";

export interface ResearchSource {
  url: string;
  title: string;
  published_at: string | null;
  source_name: string;
  source_tier: 1 | 2 | 3;
  supports: string;
}

export interface ResearchPacketContent {
  core_claim: string;
  why_it_matters: string;
  evidence_summary: string;
  sources: ResearchSource[];
  conflicting_evidence: string[];
  uncertainty: string;
  confidence: ResearchConfidence;
  open_questions: string[];
  proposed_angle: string;
}

export interface ResearchPacket {
  id: string;
  cluster_id: string;
  current_revision: number;
  state: PacketState;
  proposed_angle: string | null;
  github_run_id: string | null;
  github_run_url: string | null;
  draft_url: string | null;
  safe_error_summary: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  cluster?: {
    cluster_id: string;
    pillar: "AI" | "Decentralized" | "Reality" | "Quantum";
    topic_label: string;
    cluster_score: number | null;
    source_count: number;
  };
}

export interface ResearchPacketRevision {
  id: string;
  packet_id: string;
  revision: number;
  packet: ResearchPacketContent;
  researched_at: string;
  created_at: string;
}

export interface ResearchEvent {
  id: string;
  packet_id: string;
  revision: number | null;
  action: string;
  origin: ReviewOrigin;
  feedback: string | null;
  actor_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ApprovalSnapshot {
  id: string;
  packet_id: string;
  revision: number;
  revision_json: ResearchPacketContent;
  approved_angle: string;
  reviewer_id: string;
  origin: Exclude<ReviewOrigin, "pipeline">;
  approved_at: string;
}

export interface ResearchPacketDetail extends ResearchPacket {
  revisions: ResearchPacketRevision[];
  events: ResearchEvent[];
  approval_snapshot: ApprovalSnapshot | null;
}
