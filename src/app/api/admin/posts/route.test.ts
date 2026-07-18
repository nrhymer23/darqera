import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: mocks.from },
}));

import { PATCH, POST } from "./route";

function request(method: "POST" | "PATCH", payload: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/admin/posts", {
    method,
    headers: {
      "content-type": "application/json",
      "x-admin-key": "admin-test-key",
    },
    body: JSON.stringify(payload),
  });
}

function writeQuery(data: Record<string, unknown>) {
  return {
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

describe("admin posts route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_SECRET_KEY = "admin-test-key";
  });

  it("sanitizes a created post body before inserting it", async () => {
    const query = writeQuery({ id: "post-1" });
    mocks.from.mockReturnValue(query);

    const response = await POST(request("POST", {
      title: "Safe post",
      pillar: "A",
      body: '<p onclick="alert(1)">Safe</p><script>alert(1)</script>',
    }));

    expect(response.status).toBe(201);
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({
      body: "<p>Safe</p>",
    }));
  });

  it("sanitizes an updated post body while retaining a safe image", async () => {
    const query = writeQuery({ id: "post-1" });
    mocks.from.mockReturnValue(query);

    const response = await PATCH(request("PATCH", {
      id: "post-1",
      body: '<p onclick="alert(1)"><img src="https://cdn.test/image.webp" alt="Description" /></p><script>alert(1)</script>',
    }));

    expect(response.status).toBe(200);
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({
      body: '<p><img src="https://cdn.test/image.webp" alt="Description" /></p>',
    }));
  });

  it("requires a title and pillar when creating a post", async () => {
    const response = await POST(request("POST", { title: "Missing pillar" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Title and pillar are required",
    });
  });

  it("requires a post id when updating a post", async () => {
    const response = await PATCH(request("PATCH", { title: "Missing id" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Post ID is required",
    });
  });
});
