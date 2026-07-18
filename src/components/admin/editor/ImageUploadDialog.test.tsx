// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
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
  it("exposes a modal dialog with an accessible title", () => {
    render(
      <ImageUploadDialog
        open
        adminKey="key"
        onClose={vi.fn()}
        onInsert={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Insert image" })).toHaveAttribute(
      "aria-modal",
      "true",
    );
    expect(screen.getByLabelText("Image file")).toHaveFocus();
  });

  it("closes with Escape and restores focus to the trigger", () => {
    const onClose = vi.fn();
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Insert image</button>
          <ImageUploadDialog
            open={open}
            adminKey="key"
            onClose={() => { onClose(); setOpen(false); }}
            onInsert={vi.fn()}
          />
        </>
      );
    }
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Insert image" });
    trigger.focus();
    fireEvent.click(trigger);

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("contains Tab and Shift+Tab focus within the dialog", () => {
    render(
      <ImageUploadDialog open adminKey="key" onClose={vi.fn()} onInsert={vi.fn()} />,
    );
    const file = screen.getByLabelText("Image file");
    const submit = screen.getByRole("button", { name: "Upload and insert" });

    submit.focus();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab" });
    expect(file).toHaveFocus();

    file.focus();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab", shiftKey: true });
    expect(submit).toHaveFocus();
  });

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
            url: "https://cdn.test",
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
        src: "https://cdn.test",
        alt: "A quantum processor",
      }),
    );
    expect(vi.mocked(fetch).mock.calls[0][1]?.headers).toMatchObject({
      "x-admin-key": "key",
    });
  });

  it("exposes disabled upload controls while a request is pending", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
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

    expect(screen.getByRole("button", { name: "Uploading…" })).toBeDisabled();
    expect(screen.getByLabelText("Image file")).toBeDisabled();
    expect(screen.getByLabelText("Alt text")).toBeDisabled();
  });

  it("does not close with Escape while an upload is pending", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    const onClose = vi.fn();
    render(
      <ImageUploadDialog open adminKey="key" onClose={onClose} onInsert={vi.fn()} />,
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

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
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

  it.each([
    "http://cdn.test/image.webp",
    "data:image/webp;base64,aW1hZ2U=",
    "not a valid URL",
  ])("rejects an unsafe returned URL: %s", async (url) => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ image: { url } }), { status: 201 }),
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

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Image upload failed. Please try again.",
    );
    expect(onInsert).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upload and insert" }),
    ).toBeEnabled();
  });
});
