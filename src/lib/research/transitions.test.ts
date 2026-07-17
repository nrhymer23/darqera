import { describe, expect, it } from "vitest";

import {
  InvalidPacketTransitionError,
  assertTransition,
  canEditAngle,
} from "./transitions";
import type { PacketAction, PacketState } from "./types";

const states: PacketState[] = [
  "researching",
  "awaiting_review",
  "more_research_requested",
  "approved",
  "drafting",
  "draft_ready",
  "rejected",
  "research_failed",
  "draft_failed",
];

const actions: PacketAction[] = [
  "research_completed",
  "research_failed",
  "approve",
  "request_more_research",
  "reject",
  "research_started",
  "draft_started",
  "draft_completed",
  "draft_failed",
  "research_dispatch_failed",
  "draft_dispatch_failed",
];

const allowed = new Map<string, PacketState>([
  ["researching:research_completed", "awaiting_review"],
  ["researching:research_failed", "research_failed"],
  ["awaiting_review:approve", "approved"],
  ["awaiting_review:request_more_research", "more_research_requested"],
  ["awaiting_review:reject", "rejected"],
  ["more_research_requested:research_started", "researching"],
  ["approved:draft_started", "drafting"],
  ["drafting:draft_completed", "draft_ready"],
  ["drafting:draft_failed", "draft_failed"],
  ["research_failed:research_started", "researching"],
  ["draft_failed:draft_started", "drafting"],
  ["more_research_requested:research_dispatch_failed", "research_failed"],
  ["approved:draft_dispatch_failed", "draft_failed"],
]);

describe("research packet transition policy", () => {
  for (const state of states) {
    for (const action of actions) {
      const expected = allowed.get(`${state}:${action}`);
      if (expected) {
        it(`allows ${state} -> ${action} -> ${expected}`, () => {
          expect(assertTransition(state, action)).toBe(expected);
        });
      } else {
        it(`forbids ${action} from ${state}`, () => {
          expect(() => assertTransition(state, action)).toThrow(
            InvalidPacketTransitionError,
          );
        });
      }
    }
  }
});

describe("proposed angle editing", () => {
  for (const state of states) {
    it(`${state} ${state === "awaiting_review" ? "allows" : "forbids"} editing`, () => {
      expect(canEditAngle(state)).toBe(state === "awaiting_review");
    });
  }
});
