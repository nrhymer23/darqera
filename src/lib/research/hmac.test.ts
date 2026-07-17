import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { verifyAgenticRequest } from "./hmac";

const body = '{"action":"approve"}';
const timestamp = "1700000000";
const path = "/api/internal/research/p1/actions";
const validSignature = "20c604f10aac98b50eb1409cf2c67dada25437d9129d3bb928999e31e98d3b4a";

function request(overrides: Record<string, string> = {}) {
  return new Request(`https://darqera.com${path}`, {
    method: "POST",
    headers: {
      "x-agentic-timestamp": timestamp,
      "x-agentic-nonce": "nonce-abc",
      "x-agentic-signature": validSignature,
      ...overrides,
    },
    body,
  });
}

describe("verifyAgenticRequest", () => {
  beforeEach(() => {
    process.env.AGENTIC_OS_SHARED_SECRET = "test-secret";
  });

  afterEach(() => {
    delete process.env.AGENTIC_OS_SHARED_SECRET;
  });

  it("accepts the fixed signature vector", () => {
    expect(verifyAgenticRequest(request(), body, 1700000060)).toEqual({
      ok: true,
      nonce: "nonce-abc",
    });
  });

  it("rejects body tampering", () => {
    expect(verifyAgenticRequest(request(), '{"action":"reject"}', 1700000060)).toEqual({ ok: false });
  });

  it("rejects timestamps more than 120 seconds old or in the future", () => {
    expect(verifyAgenticRequest(request(), body, 1700000121)).toEqual({ ok: false });
    expect(verifyAgenticRequest(request(), body, 1699999879)).toEqual({ ok: false });
  });

  it("rejects missing and malformed headers", () => {
    expect(verifyAgenticRequest(request({ "x-agentic-signature": "" }), body, 1700000060)).toEqual({ ok: false });
    expect(verifyAgenticRequest(request({ "x-agentic-signature": "not-hex" }), body, 1700000060)).toEqual({ ok: false });
    expect(verifyAgenticRequest(request({ "x-agentic-timestamp": "later" }), body, 1700000060)).toEqual({ ok: false });
    expect(verifyAgenticRequest(request({ "x-agentic-nonce": "contains spaces" }), body, 1700000060)).toEqual({ ok: false });
  });

  it("rejects an equal-length invalid signature through the safe comparison path", () => {
    expect(verifyAgenticRequest(request({ "x-agentic-signature": "0".repeat(64) }), body, 1700000060)).toEqual({ ok: false });
  });

  it("fails closed when the server secret is absent", () => {
    delete process.env.AGENTIC_OS_SHARED_SECRET;
    expect(verifyAgenticRequest(request(), body, 1700000060)).toEqual({ ok: false });
  });
});
