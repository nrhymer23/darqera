// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { Editor } from "@tiptap/core";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RichTextEditor } from "./RichTextEditor";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("RichTextEditor", () => {
  it("renders existing paragraph HTML as editable text instead of literal tags", async () => {
    render(
      <RichTextEditor
        value="<p>First paragraph.</p><p>Second paragraph.</p>"
        onChange={vi.fn()}
        adminKey="key"
      />,
    );

    const editor = await screen.findByRole("textbox", { name: "Post body" });
    expect(editor).toHaveTextContent("First paragraph.");
    expect(editor).not.toHaveTextContent("<p>");
  });

  it("exposes standard formatting controls", async () => {
    render(
      <RichTextEditor value="<p>Body</p>" onChange={vi.fn()} adminKey="key" />,
    );

    for (const name of [
      "Bold",
      "Italic",
      "Underline",
      "Strikethrough",
      "Bullet list",
      "Numbered list",
      "Blockquote",
      "Add link",
      "Insert image",
      "Undo",
      "Redo",
      "Clear formatting",
      "HTML source",
      "Align left",
      "Align center",
      "Align right",
    ]) {
      expect(await screen.findByRole("button", { name })).toBeInTheDocument();
    }

    const blockStyle = await screen.findByRole("combobox", { name: "Block style" });
    expect(blockStyle).toHaveDisplayValue("Paragraph");
    expect(screen.getByRole("option", { name: "Heading 1" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Heading 2" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Heading 3" })).toBeInTheDocument();
  });

  it("preserves editor content and selection for equivalent parent HTML", async () => {
    const commandsGetter = Object.getOwnPropertyDescriptor(
      Editor.prototype,
      "commands",
    )?.get;
    expect(commandsGetter).toBeTypeOf("function");
    const setContent = vi.fn();
    vi.spyOn(Editor.prototype, "commands", "get").mockImplementation(function () {
      const commands = commandsGetter!.call(this);
      return {
        ...commands,
        setContent: (...args: Parameters<typeof commands.setContent>) => {
          setContent(...args);
          return commands.setContent(...args);
        },
      };
    });
    const { rerender } = render(
      <RichTextEditor value="<p>Keep me</p>" onChange={vi.fn()} adminKey="key" />,
    );
    const editor = await screen.findByRole("textbox", { name: "Post body" });
    const paragraph = editor.querySelector("p");
    const text = paragraph?.firstChild;
    expect(text).toBeInstanceOf(Text);

    const selection = window.getSelection();
    const range = document.createRange();
    range.setStart(text!, 4);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    rerender(
      <RichTextEditor
        value={"<p>Keep me</p>\n"}
        onChange={vi.fn()}
        adminKey="key"
      />,
    );

    expect(editor.querySelector("p")).toBe(paragraph);
    expect(editor).toHaveTextContent("Keep me");
    expect(selection?.anchorNode).toBe(text);
    expect(selection?.anchorOffset).toBe(4);
    expect(setContent).not.toHaveBeenCalled();
  });

  it("round-trips changes through HTML source mode", async () => {
    const onChange = vi.fn();
    render(
      <RichTextEditor value="<p>Original</p>" onChange={onChange} adminKey="key" />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "HTML source" }));
    fireEvent.change(screen.getByLabelText("Post body HTML"), {
      target: { value: "<h2>Revised</h2><p>Copy</p>" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Visual editor" }));

    expect(await screen.findByText("Revised")).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(
      expect.stringContaining("<h2>Revised</h2>"),
    );
  });

  it("uploads and inserts an image with safe src and alt attributes", async () => {
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
    const onChange = vi.fn();
    render(
      <RichTextEditor value="<p>Body</p>" onChange={onChange} adminKey="key" />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Insert image" }));
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
      expect(onChange).toHaveBeenCalledWith(
        expect.stringContaining(
          '<img src="https://cdn.test/image.webp" alt="A quantum processor">',
        ),
      ),
    );
  });
});
