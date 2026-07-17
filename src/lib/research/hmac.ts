import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_WINDOW_SECONDS = 120;
const HEX_SHA256 = /^[a-f0-9]{64}$/;
const SAFE_NONCE = /^[A-Za-z0-9._:-]{8,128}$/;

export type AgenticVerification =
  | { ok: true; nonce: string }
  | { ok: false };

export function verifyAgenticRequest(
  request: Request,
  rawBody: string,
  now = Math.floor(Date.now() / 1000),
): AgenticVerification {
  const secret = process.env.AGENTIC_OS_SHARED_SECRET;
  const timestampHeader = request.headers.get("x-agentic-timestamp");
  const nonce = request.headers.get("x-agentic-nonce");
  const signature = request.headers.get("x-agentic-signature")?.toLowerCase();

  if (!secret || !timestampHeader || !nonce || !signature) return { ok: false };
  if (!/^\d{10}$/.test(timestampHeader) || !SAFE_NONCE.test(nonce)) return { ok: false };
  if (!HEX_SHA256.test(signature)) return { ok: false };

  const timestamp = Number(timestampHeader);
  if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > SIGNATURE_WINDOW_SECONDS) {
    return { ok: false };
  }

  const url = new URL(request.url);
  const bodyHash = createHash("sha256").update(rawBody).digest("hex");
  const signed = [
    request.method.toUpperCase(),
    url.pathname,
    timestampHeader,
    nonce,
    bodyHash,
  ].join("\n");
  const expected = createHmac("sha256", secret).update(signed).digest();
  const provided = Buffer.from(signature, "hex");
  if (provided.length !== expected.length) return { ok: false };

  return timingSafeEqual(expected, provided)
    ? { ok: true, nonce }
    : { ok: false };
}
