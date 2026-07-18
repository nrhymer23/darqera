/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState, type FormEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PostEditorForm } from "./PostEditorForm";

afterEach(cleanup);

function Harness({ save = vi.fn() }: { save?: (body: string) => void }) {
  const [body, setBody] = useState("<p>Existing body</p>");
  return (
    <PostEditorForm
      title="Title"
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
      handleSave={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        save(body);
      }}
      resetForm={vi.fn()}
      showPosts={vi.fn()}
    />
  );
}

describe("PostEditorForm rich editor integration", () => {
  it("submits current source HTML without requiring a return to visual mode", async () => {
    const save = vi.fn();
    render(<Harness save={save} />);

    fireEvent.click(await screen.findByRole("button", { name: "HTML source" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Post body HTML" }), {
      target: { value: "<h2>Saved from source</h2>" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Create Post" }).closest("form")!);

    expect(save).toHaveBeenCalledWith("<h2>Saved from source</h2>");
  });

  it("associates the visible Body label and focuses the visual textbox when clicked", async () => {
    render(<Harness />);
    const textbox = await screen.findByRole("textbox", { name: "Body" });

    expect(textbox).toHaveAttribute("aria-labelledby", "admin-post-body-label");
    fireEvent.click(screen.getByText("Body"));
    expect(textbox).toHaveFocus();
  });
});
