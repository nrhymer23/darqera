"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useState } from "react";

import { EditorToolbar } from "./EditorToolbar";
import { ImageUploadDialog } from "./ImageUploadDialog";

type RichTextEditorProps = {
  value: string;
  onChange(html: string): void;
  adminKey: string;
};

export function RichTextEditor({ value, onChange, adminKey }: RichTextEditorProps) {
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceValue, setSourceValue] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false, underline: false }),
      Underline,
      Link.configure({
        autolink: false,
        openOnClick: false,
        protocols: ["mailto"],
      }),
      Image.configure({ inline: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  useEffect(() => {
    if (!editor || value === editor.getHTML()) return;

    const container = document.createElement("div");
    container.innerHTML = value;
    const nextDocument = ProseMirrorDOMParser.fromSchema(editor.schema).parse(
      container,
    );
    if (!nextDocument.eq(editor.state.doc)) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const toggleSourceMode = () => {
    if (sourceMode) {
      editor.commands.setContent(sourceValue, { emitUpdate: true });
      setSourceMode(false);
      return;
    }
    setSourceValue(editor.getHTML());
    setSourceMode(true);
  };

  return (
    <div className="admin-rich-editor">
      <EditorToolbar
        editor={editor}
        onInsertImage={() => setImageDialogOpen(true)}
        sourceMode={sourceMode}
        onToggleSourceMode={toggleSourceMode}
      />
      {sourceMode ? (
        <label className="admin-rich-editor__source">
          Post body HTML
          <textarea
            aria-label="Post body HTML"
            value={sourceValue}
            onChange={(event) => setSourceValue(event.target.value)}
          />
        </label>
      ) : (
        <EditorContent
          editor={editor}
          role="textbox"
          aria-label="Post body"
          className="admin-rich-editor__content"
        />
      )}
      <ImageUploadDialog
        open={imageDialogOpen}
        adminKey={adminKey}
        onClose={() => setImageDialogOpen(false)}
        onInsert={(image) => {
          editor.chain().focus().setImage({ src: image.src, alt: image.alt }).run();
          setImageDialogOpen(false);
        }}
      />
    </div>
  );
}
