# Darqera Cluster Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a production-safe Darqera Admin picker that starts research for exactly one validated signal cluster after Noel reviews its full source context.

**Architecture:** Darqera reads eligible clusters through server-only store functions and starts work through one atomic Supabase RPC. The RPC creates or replays the canonical packet and event before Darqera dispatches the existing focused `research-packet.yml` workflow with that packet ID. A focused client component renders selection, detail, direction, busy/error state, and refreshes the canonical queue after success.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase/Postgres, Vitest, Testing Library, Python 3.14, pytest, GitHub Actions.

## Global Constraints

- Darqera is the canonical control plane.
- One click starts one cluster and one workflow dispatch.
- Public Supabase roles remain denied access to research-control tables and RPCs.
- Research direction is optional and is stored in the canonical event before dispatch.
- Drafting remains approval-gated.
- Existing unrelated `.claude/` files are preserved.

---

### Task 1: Atomic cluster-to-packet start RPC

**Files:**
- Create: `darq-signal-pipeline/supabase/migrations/20260717050000_start_cluster_research.sql`
- Modify: `darq-signal-pipeline/tests/test_research_schema.py`

**Interfaces:**
- Consumes: `cluster_id text`, `direction text`, `idempotency_key text`, `actor_id text`, `origin text`.
- Produces: `start_cluster_research(...) returns table(packet_id uuid, state text, version integer, replayed boolean)`.

- [ ] **Step 1: Write the failing schema test**

```python
START_SQL_PATH = Path("supabase/migrations/20260717050000_start_cluster_research.sql")

def test_cluster_start_is_atomic_private_and_idempotent():
    sql = START_SQL_PATH.read_text()
    assert "CREATE OR REPLACE FUNCTION start_cluster_research" in sql
    assert "status = 'validated'" in sql
    assert "ON CONFLICT (cluster_id) DO NOTHING" in sql
    assert "research_requested" in sql
    assert "GRANT EXECUTE ON FUNCTION public.start_cluster_research" in sql
    assert "TO service_role" in sql
    assert "FROM PUBLIC, anon, authenticated" in sql
```

- [ ] **Step 2: Run the focused test and verify missing migration failure**

Run: `pytest -q tests/test_research_schema.py`
Expected: FAIL with `FileNotFoundError` for `20260717050000_start_cluster_research.sql`.

- [ ] **Step 3: Implement the minimal RPC migration**

The function locks the validated cluster, inserts the packet with `ON CONFLICT DO NOTHING`, reads the canonical packet, inserts one `research_requested` event only for the creator, returns `replayed`, revokes public execution, and grants execution to `service_role`.

- [ ] **Step 4: Run focused and full pipeline tests**

Run: `pytest -q tests/test_research_schema.py && pytest -q`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260717050000_start_cluster_research.sql tests/test_research_schema.py
git commit -m "feat: start focused cluster research atomically"
```

### Task 2: Darqera cluster store and types

**Files:**
- Modify: `src/lib/research/types.ts`
- Modify: `src/lib/research/store.ts`
- Modify: `src/lib/research/store.test.ts`

**Interfaces:**
- Produces: `listEligibleClusters()`, `getEligibleCluster(clusterId)`, and `startClusterResearch(input)`.
- `startClusterResearch` returns `{ packetId, state, version, replayed }`.

- [ ] **Step 1: Write failing store tests**

Tests assert validated filtering, exclusion of clusters with packets, item resolution through `item_ids`, RPC argument mapping, replay return values, and safe error redaction.

- [ ] **Step 2: Run focused tests**

Run: `npm test -- src/lib/research/store.test.ts`
Expected: FAIL because cluster store functions are not exported.

- [ ] **Step 3: Add focused types and store functions**

```ts
export interface EligibleClusterSummary {
  cluster_id: string;
  pillar: "AI" | "Decentralized" | "Reality" | "Quantum";
  topic_label: string;
  summary: string | null;
  source_count: number;
  cluster_score: number | null;
  freshness_hours: number | null;
}
```

Use server-only `supabaseAdmin`, bounded query results, safe store errors, and the new RPC.

- [ ] **Step 4: Rerun focused tests**

Run: `npm test -- src/lib/research/store.test.ts`
Expected: all store tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/research/types.ts src/lib/research/store.ts src/lib/research/store.test.ts
git commit -m "feat: expose eligible research clusters"
```

### Task 3: Focused start action and authenticated routes

**Files:**
- Modify: `src/lib/research/actions.ts`
- Modify: `src/lib/research/actions.test.ts`
- Create: `src/app/api/admin/research/clusters/route.ts`
- Create: `src/app/api/admin/research/clusters/[clusterId]/route.ts`
- Create: `src/app/api/admin/research/clusters/[clusterId]/start/route.ts`
- Create: `src/app/api/admin/research/clusters/routes.test.ts`

**Interfaces:**
- Produces: `startFocusedResearch({ clusterId, direction, idempotencyKey, actorId, origin })`.
- Routes require `x-admin-key`; start accepts JSON `{ direction?: string, idempotencyKey: string }`.

- [ ] **Step 1: Write failing action tests**

Verify one canonical start followed by one `dispatchResearch`, replay skips dispatch, missing idempotency key fails validation, and dispatch failure moves the packet to `research_failed` with a safe message.

- [ ] **Step 2: Run action tests**

Run: `npm test -- src/lib/research/actions.test.ts`
Expected: FAIL because `startFocusedResearch` does not exist.

- [ ] **Step 3: Implement action orchestration**

```ts
const started = await startClusterResearch(input);
if (started.replayed) return started;
await dispatchResearch({
  packetId: started.packetId,
  feedback: input.direction,
  idempotencyKey: input.idempotencyKey,
});
return started;
```

On dispatch error, use the existing safe failure transition before returning `PacketDispatchError`.

- [ ] **Step 4: Write failing route tests**

Test all three route handlers directly. Assert `401` without `x-admin-key`, `200` list/detail responses with valid authentication, `400` for a blank idempotency key, `202` for a successful start, and safe error bodies that exclude database and GitHub details.

Run: `npm test -- src/app/api/admin/research/clusters/routes.test.ts`
Expected: FAIL because the route modules do not exist.

- [ ] **Step 5: Add authenticated routes with safe responses**

All routes call `checkAdminAuth`, validate cluster/idempotency input, and pass errors through `researchErrorResponse`.

- [ ] **Step 6: Rerun action, route, and full unit tests**

Run: `npm test -- src/lib/research/actions.test.ts src/app/api/admin/research/clusters/routes.test.ts && npm test`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/research/actions.ts src/lib/research/actions.test.ts src/app/api/admin/research/clusters
git commit -m "feat: add focused research start API"
```

### Task 4: Cluster picker UI

**Files:**
- Create: `src/components/admin/ClusterPicker.tsx`
- Create: `src/components/admin/ClusterPicker.test.tsx`
- Modify: `src/components/admin/ResearchQueue.tsx`

**Interfaces:**
- `ClusterPicker({ adminKey, onStarted })` fetches list/detail endpoints and calls the start endpoint.
- `onStarted()` refreshes the canonical research queue.

- [ ] **Step 1: Write failing component tests**

Render mocked cluster list/detail responses and verify topic, pillar, score, source counts, summary, score breakdown, source title/platform/excerpt/link, direction input, disabled busy state, one POST, success refresh, and safe error copy.

- [ ] **Step 2: Run component tests**

Run: `npm test -- src/components/admin/ClusterPicker.test.tsx`
Expected: FAIL because `ClusterPicker` does not exist.

- [ ] **Step 3: Implement the component**

Use the existing Darqera card, border, muted-text, cyan-accent, and responsive grid vocabulary. Keep selection and confirmation above the current queue; do not add animation or unrelated redesign.

- [ ] **Step 4: Integrate into ResearchQueue**

Render `<ClusterPicker adminKey={adminKey} onStarted={refresh} />` before queue filters. A successful start refreshes both eligible clusters and packet state.

- [ ] **Step 5: Run component and full Darqera verification**

Run: `npm test && npm run lint && npm run build`
Expected: all tests pass; lint and production build exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/ClusterPicker.tsx src/components/admin/ClusterPicker.test.tsx src/components/admin/ResearchQueue.tsx
git commit -m "feat: add Darqera signal cluster picker"
```

### Task 5: Deploy and production acceptance

**Files:**
- No new source files.

**Interfaces:**
- Supabase migration `20260717050000`.
- Darqera production `main` and pipeline production `master`.

- [ ] **Step 1: Re-run fresh verification**

Run pipeline: `pytest -q`
Run Darqera: `npm test && npm run lint && npm run build`
Expected: all commands exit 0.

- [ ] **Step 2: Push both feature branches and production branches**

Use fast-forward merges from isolated worktrees; preserve unrelated worktree state.

- [ ] **Step 3: Dry-run and deploy the migration**

Run: `npx supabase db push --linked --dry-run`
Expected: only `20260717050000_start_cluster_research.sql` is pending.

Run: `npx supabase db push --linked --yes`
Expected: migration applies successfully.

- [ ] **Step 4: Verify deployment status**

Run: `npx vercel ls darqera --environment production --limit 3 --format json`
Expected: latest Darqera commit is `READY`.

- [ ] **Step 5: Run one real acceptance flow**

Select one eligible cluster, enter a specific direction, start research, verify exactly one GitHub run and one packet, then confirm the packet reaches `awaiting_review` without creating a draft.
