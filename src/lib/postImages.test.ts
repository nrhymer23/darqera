import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    storage: { from: mocks.from },
  },
}));

import { uploadPostImage, validatePostImage } from "./postImages";

describe("post images", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({
      upload: mocks.upload,
      getPublicUrl: mocks.getPublicUrl,
    });
  });

  it("rejects unsupported files and files above 10 MB", () => {
    expect(() =>
      validatePostImage(new File(["x"], "note.txt", { type: "text/plain" })),
    ).toThrow("JPEG, PNG, WebP, or GIF");
    expect(() =>
      validatePostImage(
        new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", {
          type: "image/png",
        }),
      ),
    ).toThrow("10 MB");
  });

  it("uploads to post-images with a collision-resistant safe path", async () => {
    mocks.upload.mockResolvedValue({ error: null });
    mocks.getPublicUrl.mockReturnValue({
      data: { publicUrl: "https://cdn.test/post-images/2026/07/id.webp" },
    });

    const result = await uploadPostImage(
      new File(["image"], "My Image.webp", { type: "image/webp" }),
    );

    expect(mocks.from).toHaveBeenCalledWith("post-images");
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}\/\d{2}\/[a-f0-9-]+\.webp$/),
      expect.any(File),
      expect.objectContaining({ contentType: "image/webp", upsert: false }),
    );
    expect(result.url).toMatch(/^https:\/\//);
  });
});
