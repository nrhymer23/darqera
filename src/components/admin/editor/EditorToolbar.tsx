"use client";

import type { Editor } from "@tiptap/react";
import { useState } from "react";

type EditorToolbarProps = {
  editor: Editor;
  onInsertImage(): void;
  sourceMode: boolean;
  onToggleSourceMode(): void;
};

const preserveSelection = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
};

const isSafeLink = (value: string) => /^(https?:\/\/|mailto:)/i.test(value);

export function EditorToolbar({
  editor,
  onInsertImage,
  sourceMode,
  onToggleSourceMode,
}: EditorToolbarProps) {
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState("");

  const toggleLinkPopover = () => {
    const linked = editor.isActive("link");
    setLinkValue(linked ? String(editor.getAttributes("link").href ?? "") : "");
    setLinkError("");
    setLinkPopoverOpen((open) => !open);
  };

  const submitLink = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const href = linkValue.trim();
    if (!isSafeLink(href)) {
      setLinkError("Use an http, https, or mailto URL");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setLinkPopoverOpen(false);
  };

  const button = (
    label: string,
    action: () => void,
    options: { pressed?: boolean; disabled?: boolean } = {},
  ) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={options.pressed}
      disabled={sourceMode || options.disabled}
      onMouseDown={preserveSelection}
      onClick={action}
    >
      {label}
    </button>
  );

  return (
    <div className="admin-rich-editor__toolbar" aria-label="Text formatting">
      <label>
        Block style
        <select
          aria-label="Block style"
          disabled={sourceMode}
          value={
            editor.isActive("heading", { level: 1 })
              ? "1"
              : editor.isActive("heading", { level: 2 })
                ? "2"
                : editor.isActive("heading", { level: 3 })
                  ? "3"
                  : "paragraph"
          }
          onChange={(event) => {
            const value = event.target.value;
            if (value === "paragraph") {
              editor.chain().focus().setParagraph().run();
              return;
            }
            editor
              .chain()
              .focus()
              .setHeading({ level: Number(value) as 1 | 2 | 3 })
              .run();
          }}
        >
          <option value="paragraph">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>
      </label>

      {button("Bold", () => editor.chain().focus().toggleBold().run(), {
        pressed: editor.isActive("bold"),
      })}
      {button("Italic", () => editor.chain().focus().toggleItalic().run(), {
        pressed: editor.isActive("italic"),
      })}
      {button("Underline", () => editor.chain().focus().toggleUnderline().run(), {
        pressed: editor.isActive("underline"),
      })}
      {button("Strikethrough", () => editor.chain().focus().toggleStrike().run(), {
        pressed: editor.isActive("strike"),
      })}
      {button("Bullet list", () => editor.chain().focus().toggleBulletList().run(), {
        pressed: editor.isActive("bulletList"),
      })}
      {button("Numbered list", () => editor.chain().focus().toggleOrderedList().run(), {
        pressed: editor.isActive("orderedList"),
      })}
      {button("Blockquote", () => editor.chain().focus().toggleBlockquote().run(), {
        pressed: editor.isActive("blockquote"),
      })}
      {button("Align left", () => editor.chain().focus().setTextAlign("left").run(), {
        pressed: editor.isActive({ textAlign: "left" }),
      })}
      {button("Align center", () => editor.chain().focus().setTextAlign("center").run(), {
        pressed: editor.isActive({ textAlign: "center" }),
      })}
      {button("Align right", () => editor.chain().focus().setTextAlign("right").run(), {
        pressed: editor.isActive({ textAlign: "right" }),
      })}
      {button(editor.isActive("link") ? "Edit link" : "Add link", toggleLinkPopover)}
      {editor.isActive("link") &&
        button("Remove link", () => editor.chain().focus().unsetLink().run())}
      {button("Insert image", onInsertImage)}
      {button("Undo", () => editor.chain().focus().undo().run(), {
        disabled: !editor.can().chain().focus().undo().run(),
      })}
      {button("Redo", () => editor.chain().focus().redo().run(), {
        disabled: !editor.can().chain().focus().redo().run(),
      })}
      {button("Clear formatting", () =>
        editor.chain().focus().clearNodes().unsetAllMarks().run(),
      )}
      <button
        type="button"
        aria-label={sourceMode ? "Visual editor" : "HTML source"}
        aria-pressed={sourceMode}
        onClick={onToggleSourceMode}
      >
        {sourceMode ? "Visual editor" : "HTML source"}
      </button>

      {linkPopoverOpen && !sourceMode && (
        <form className="admin-rich-editor__link-popover" onSubmit={submitLink}>
          <label>
            Link URL
            <input
              type="url"
              value={linkValue}
              onChange={(event) => setLinkValue(event.target.value)}
              placeholder="https://example.com"
            />
          </label>
          {linkError && <p role="alert">{linkError}</p>}
          <button type="submit">Apply link</button>
          <button type="button" onClick={() => setLinkPopoverOpen(false)}>
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
