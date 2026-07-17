# Darqera Cluster Picker Design

## Goal

Let Noel select exactly one validated signal cluster in Darqera Admin, review its full context, add optional research direction, and start one approval-gated research job while Darqera remains the canonical control plane.

## User experience

The Research tab at `/admin` gains a **Choose a signal** section above the existing research queue.

The section lists clusters whose status is `validated` and which do not already have a research packet. Each row shows the topic, pillar, cluster score, and source count. Selecting a row opens a confirmation panel with:

- topic label and summary;
- pillar, score, freshness, and tier/source counts;
- score breakdown;
- underlying source items with title, source, platform, excerpt, publication date, and link;
- an optional **Research direction** text area;
- one **Start research** button.

Selection never starts work by itself. The button is disabled during submission to prevent repeat clicks. After a successful start, the cluster disappears from **Choose a signal** and its packet appears in the research queue with state `researching`.

## Canonical data flow

1. Darqera reads eligible clusters and their `item_ids` from Supabase using the server-only service role.
2. Darqera resolves those item IDs to `darq_raw_items` for the confirmation detail.
3. On **Start research**, Darqera atomically creates one `darq_research_packets` row for the chosen cluster, records a `research_requested` event containing the optional direction, and returns the packet ID.
4. Darqera dispatches `research-packet.yml` with the packet ID, direction, and an idempotency key.
5. The pipeline loads that exact packet and cluster. It never scans or starts every validated cluster for this action.
6. The pipeline saves a research revision and moves the packet to `awaiting_review`.
7. Drafting remains impossible until the existing approval action creates an immutable approval snapshot.

The existing unique constraint on `darq_research_packets.cluster_id` is the final duplicate guard. Repeated requests return the existing packet without dispatching a second workflow.

## Interfaces

Darqera adds authenticated admin endpoints:

- `GET /api/admin/research/clusters` returns eligible cluster summaries.
- `GET /api/admin/research/clusters/:clusterId` returns one eligible cluster plus its source items.
- `POST /api/admin/research/clusters/:clusterId/start` accepts `direction` and `idempotencyKey`, creates or replays the canonical packet, and dispatches focused research.

The GitHub workflow keeps `packet_id`, `feedback`, and `idempotency_key` as its inputs. No new cluster-wide workflow mode is used by the UI.

## Failure handling

- Invalid or ineligible cluster IDs return a safe validation error.
- Concurrent starts resolve through the unique cluster constraint and idempotency record.
- If GitHub rejects the dispatch, the packet moves to `research_failed` with a safe error summary and remains retryable from the existing queue.
- Database details, service keys, GitHub responses, and research-provider errors are never returned to the browser.
- Public Supabase roles remain unable to access research-control tables or RPCs.

## Testing and acceptance

- Store tests cover eligible filtering, source resolution, atomic packet creation, duplicate replay, and safe errors.
- Action tests cover one focused dispatch and dispatch-failure state.
- Route tests cover admin authentication and request validation.
- Component tests cover selection, full detail rendering, direction entry, disabled/busy state, success refresh, and errors.
- Pipeline tests prove a packet ID researches only that packet.
- Production acceptance uses one real eligible cluster and confirms one GitHub run, one research packet, one revision, and no draft before approval.

## Scope

This change does not add Agentic OS controls, bulk selection, scheduling, shortlist states, automatic publishing, or a new visual redesign. Agentic OS can consume the same canonical Darqera APIs in a later implementation.
