const REPOSITORY = "nrhymer23/darq-signal-pipeline";
const REF = "master";

export class GitHubDispatchError extends Error {
  readonly retryable: boolean;

  constructor(retryable: boolean) {
    super(
      retryable
        ? "Workflow dispatch is temporarily unavailable"
        : "Workflow dispatch was rejected",
    );
    this.name = "GitHubDispatchError";
    this.retryable = retryable;
  }
}

async function dispatch(
  workflow: "research-packet.yml" | "draft-approved.yml",
  inputs: Record<string, string>,
) {
  const token = process.env.DARQ_PIPELINE_GITHUB_TOKEN;
  if (!token) throw new GitHubDispatchError(false);

  let response: Response;
  try {
    response = await fetch(
      `https://api.github.com/repos/${REPOSITORY}/actions/workflows/${workflow}/dispatches`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ ref: REF, inputs }),
      },
    );
  } catch {
    throw new GitHubDispatchError(true);
  }

  if (response.status !== 204) {
    const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
    throw new GitHubDispatchError(retryable);
  }
  return { accepted: true as const };
}

export function dispatchResearch(input: {
  packetId: string;
  feedback: string;
  idempotencyKey: string;
}) {
  return dispatch("research-packet.yml", {
    packet_id: input.packetId,
    feedback: input.feedback,
    idempotency_key: input.idempotencyKey,
  });
}

export function dispatchDraft(input: {
  snapshotId: string;
  idempotencyKey: string;
}) {
  return dispatch("draft-approved.yml", {
    snapshot_id: input.snapshotId,
    idempotency_key: input.idempotencyKey,
  });
}
