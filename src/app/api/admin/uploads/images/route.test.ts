import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  uploadPostImage: vi.fn(),
}));

vi.mock("@/lib/postImages", () => ({
  uploadPostImage: mocks.uploadPostImage,
}));

import { POST } from "./route";

function authenticatedRequest(form: FormData) {
  return new NextRequest("http://localhost/api/admin/uploads/images", {
    method: "POST",
    headers: { "x-admin-key": "admin-test-key" },
    body: form,
  });
}

describe("post image upload route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_SECRET_KEY = "admin-test-key";
  });

  it("rejects requests without the admin key", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/admin/uploads/images", {
        method: "POST",
      }),
    );
    expect(response.status).toBe(401);
  });

  it("requires a multipart file", async () => {
    const response = await POST(authenticatedRequest(new FormData()));
    expect(response.status).toBe(400);
  });

  it("returns the uploaded public image", async () => {
    mocks.uploadPostImage.mockResolvedValue({
      url: "https://cdn.test/image.webp",
      path: "2026/07/id.webp",
    });
    const form = new FormData();
    form.set(
      "file",
      new File(["image"], "image.webp", { type: "image/webp" }),
    );

    const response = await POST(authenticatedRequest(form));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      image: {
        url: "https://cdn.test/image.webp",
        path: "2026/07/id.webp",
      },
    });
  });
});
