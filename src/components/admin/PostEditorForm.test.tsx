/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState, type FormEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ editorProps: vi.fn() }));

vi.mock("@/components/admin/editor/RichTextEditor", () => ({
  RichTextEditor: (props: {
    value: string;
    onChange(value: string): void;
    adminKey: string;
  }) => {
    mocks.editorProps(props);
    return (
      <textarea
        aria-label="Post body"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    );
  },
}));

import { PostEditorForm } from "./PostEditorForm";

afterEach(cleanup);

describe("PostEditorForm", () => {
  it("passes the existing body to the editor and submits updated HTML", () => {
    const save = vi.fn<(body: string) => void>();

    function Harness() {
      const [body, setBody] = useState("<p>Existing body</p>");
      const handleSave = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        save(body);
      };
      return (
        <PostEditorForm
          title="Title"
          setTitle={vi.fn()}
          handleTitleChange={vi.fn()}
          slug="title"
          setSlug={vi.fn()}
          pillar="A"
          setPillar={vi.fn()}
          excerpt="Excerpt"
          setExcerpt={vi.fn()}
          body={body}
          setBody={setBody}
          status="draft"
          setStatus={vi.fn()}
          tags="ai"
          setTags={vi.fn()}
          adminKey="admin-key"
          loading={false}
          editingId={null}
          handleSave={handleSave}
          resetForm={vi.fn()}
          showPosts={vi.fn()}
        />
      );
    }

    render(<Harness />);

    expect(screen.getByRole("textbox", { name: "Post body" })).toHaveValue(
      "<p>Existing body</p>",
    );
    expect(mocks.editorProps).toHaveBeenLastCalledWith(expect.objectContaining({
      value: "<p>Existing body</p>",
      adminKey: "admin-key",
    }));

    fireEvent.change(screen.getByRole("textbox", { name: "Post body" }), {
      target: { value: "<p>Updated body</p>" },
    });
    expect(screen.getByRole("textbox", { name: "Post body" })).toHaveValue(
      "<p>Updated body</p>",
    );

    fireEvent.submit(screen.getByRole("button", { name: "Create Post" }).closest("form")!);
    expect(save).toHaveBeenCalledWith("<p>Updated body</p>");
    expect(mocks.editorProps).toHaveBeenLastCalledWith(expect.objectContaining({
      value: "<p>Updated body</p>",
    }));
  });
});
