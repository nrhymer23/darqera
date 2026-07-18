// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ImageUploadDialog } from "./ImageUploadDialog";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ImageUploadDialog", () => {
  it("requires both an image and alt text", async () => {
    render(
      <ImageUploadDialog
        open
        adminKey="key"
        onClose={vi.fn()}
        onInsert={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Upload and insert" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose an image and describe it",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uploads with the admin key and inserts the returned URL", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          image: {
            url: "https://cdn.test/image.webp",
            path: "2026/07/id.webp",
          },
        }),
        { status: 201 },
      ),
    );
    const onInsert = vi.fn();
    render(
      <ImageUploadDialog
        open
        adminKey="key"
        onClose={vi.fn()}
        onInsert={onInsert}
      />,
    );
    fireEvent.change(screen.getByLabelText("Image file"), {
      target: {
        files: [new File(["image"], "image.webp", { type: "image/webp" })],
      },
    });
    fireEvent.change(screen.getByLabelText("Alt text"), {
      target: { value: "A quantum processor" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload and insert" }));
    await waitFor(() =>
      expect(onInsert).toHaveBeenCalledWith({
        src: "https://cdn.test/image.webp",
        alt: "A quantum processor",
      }),
    );
    expect(vi.mocked(fetch).mock.calls[0][1]?.headers).toMatchObject({
      "x-admin-key": "key",
    });
  });

  it("keeps the dialog open with a safe error and enables retry after failure", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Image upload failed" }), {
        status: 500,
      }),
    );
    render(
      <ImageUploadDialog
        open
        adminKey="key"
        onClose={vi.fn()}
        onInsert={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Image file"), {
      target: {
        files: [new File(["image"], "image.webp", { type: "image/webp" })],
      },
    });
    fireEvent.change(screen.getByLabelText("Alt text"), {
      target: { value: "A quantum processor" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload and insert" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Image upload failed",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upload and insert" }),
    ).toBeEnabled();
    expect(screen.getByLabelText("Image file")).toBeEnabled();
    expect(screen.getByLabelText("Alt text")).toHaveValue(
      "A quantum processor",
    );
  });
});
