"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const btn = (active: boolean) =>
    `px-2 py-1 text-xs rounded transition-colors ${
      active
        ? "bg-gold/20 text-gold"
        : "text-text-tertiary hover:text-text-primary"
    }`;

  return (
    <div className="flex items-center gap-1 pb-2 mb-2" style={{ borderBottom: "0.5px solid rgba(201, 162, 75, 0.1)" }}>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btn(editor.isActive("bold"))}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btn(editor.isActive("italic"))}
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btn(editor.isActive("bulletList"))}
      >
        List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btn(editor.isActive("blockquote"))}
      >
        Quote
      </button>
    </div>
  );
}

// Convert Tiptap HTML to simple markdown
function htmlToMarkdown(html: string): string {
  let md = html;
  md = md.replace(/<strong>(.*?)<\/strong>/g, "**$1**");
  md = md.replace(/<em>(.*?)<\/em>/g, "*$1*");
  md = md.replace(/<blockquote><p>(.*?)<\/p><\/blockquote>/g, "> $1");
  md = md.replace(/<li><p>(.*?)<\/p><\/li>/g, "- $1");
  md = md.replace(/<ul>/g, "");
  md = md.replace(/<\/ul>/g, "");
  md = md.replace(/<p><\/p>/g, "");
  md = md.replace(/<p>(.*?)<\/p>/g, "$1\n\n");
  md = md.replace(/<br\s*\/?>/g, "\n");
  md = md.replace(/<[^>]+>/g, "");
  md = md.replace(/\n{3,}/g, "\n\n");
  return md.trim();
}

// Convert simple markdown to HTML for Tiptap
function markdownToHtml(md: string): string {
  if (!md) return "<p></p>";

  const lines = md.split("\n");
  const htmlLines: string[] = [];
  let inList = false;

  for (const line of lines) {
    if (line.startsWith("- ")) {
      if (!inList) {
        htmlLines.push("<ul>");
        inList = true;
      }
      let content = line.slice(2);
      content = content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      content = content.replace(/\*(.+?)\*/g, "<em>$1</em>");
      htmlLines.push(`<li><p>${content}</p></li>`);
    } else {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }
      if (line.startsWith("> ")) {
        let content = line.slice(2);
        content = content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        content = content.replace(/\*(.+?)\*/g, "<em>$1</em>");
        htmlLines.push(`<blockquote><p>${content}</p></blockquote>`);
      } else if (line.trim()) {
        let content = line;
        content = content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        content = content.replace(/\*(.+?)\*/g, "<em>$1</em>");
        htmlLines.push(`<p>${content}</p>`);
      }
    }
  }

  if (inList) htmlLines.push("</ul>");
  return htmlLines.join("") || "<p></p>";
}

export default function RichEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || "Write something...",
      }),
    ],
    content: markdownToHtml(value),
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[80px] text-sm text-text-secondary leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(htmlToMarkdown(editor.getHTML()));
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && !editor.isFocused) {
      const currentMd = htmlToMarkdown(editor.getHTML());
      if (currentMd !== value) {
        editor.commands.setContent(markdownToHtml(value));
      }
    }
  }, [value, editor]);

  return (
    <div
      className="bg-bg border border-border rounded px-3 py-2 focus-within:border-gold transition-colors"
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
