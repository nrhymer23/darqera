// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RichTextEditor } from "./RichTextEditor";

afterEach(cleanup);

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
    ]) {
      expect(await screen.findByRole("button", { name })).toBeInTheDocument();
    }
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
});
