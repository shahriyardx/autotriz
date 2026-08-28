"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "tiptap-markdown";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Library,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { api } from "@/trpc/react";
import { MediaPicker } from "@/components/admin/media/media-library";
import { IMAGE_ACCEPT, useMediaUpload } from "@/components/admin/media/use-upload";
import { Button } from "@/components/ui-kit/button";
import { cn } from "@/lib/cn";

/* ==================================================================
   A rich-text editor whose value is Markdown.

   Tiptap edits a document; `tiptap-markdown` parses the incoming
   Markdown and serialises it back out on every change, so what the
   form holds — and what the database stores — stays Markdown. The
   storefront renders that same Markdown with react-markdown.
   ================================================================== */

/** `tiptap-markdown` adds this to the editor storage but ships no types
 *  for it, so declare the one method we use. */
type MarkdownStorage = { markdown: { getMarkdown: () => string } };
const getMarkdown = (editor: Editor) =>
  (editor.storage as unknown as MarkdownStorage).markdown.getMarkdown();

export function MarkdownEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  minHeight = "16rem",
  id,
  invalid,
}: {
  value: string;
  onChange: (markdown: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minHeight?: string;
  id?: string;
  invalid?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [picking, setPicking] = useState(false);
  const { uploadOne, busy: uploading } = useMediaUpload("content");

  const status = api.media.status.useQuery();

  const editor = useEditor({
    // The markup is rendered on the server as Markdown, not as this
    // editor's DOM, so there is nothing to hydrate.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false }),
      Markdown.configure({ html: false, transformPastedText: true, linkify: true }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: value,
    editorProps: {
      attributes: {
        id: id ?? "",
        class: cn(
          "prose-editor max-w-none px-4 py-3 outline-none",
          "[&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:mt-4 [&_h4]:font-semibold",
          "[&_p]:my-3 [&_p:first-child]:mt-0",
          "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1",
          "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
          "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
          "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm",
          "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4",
          "[&_hr]:my-6 [&_hr]:border-border",
          "[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-md",
          // Tiptap marks the first empty node; the placeholder sits in
          // its ::before so it lines up with the caret exactly.
          "[&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-muted-foreground [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
        ),
      },
    },
    onUpdate: ({ editor: e }) => onChange(getMarkdown(e)),
    onBlur: () => onBlur?.(),
  });

  // Adopt an external reset (form.reset, switching product) without
  // clobbering what is being typed.
  useEffect(() => {
    if (!editor) return;
    if (value === getMarkdown(editor)) return;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [value, editor]);

  const upload = useCallback(
    async (file: File | undefined) => {
      if (!file || !editor) return;
      const row = await uploadOne(file);
      if (row) {
        editor.chain().focus().setImage({ src: row.url, alt: row.alt ?? row.filename }).run();
      }
    },
    [uploadOne, editor],
  );

  // Drag an image onto the editor, or paste one from the clipboard.
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;

    const imageFrom = (list: FileList | DataTransferItemList | null | undefined) => {
      if (!list) return undefined;
      const files = Array.from(list as ArrayLike<File | DataTransferItem>).map((entry) =>
        "getAsFile" in entry ? entry.getAsFile() : entry,
      );
      return files.find((f): f is File => Boolean(f && f.type.startsWith("image/")));
    };

    const onDrop = (event: DragEvent) => {
      const file = imageFrom(event.dataTransfer?.files);
      if (!file) return;
      event.preventDefault();
      void upload(file);
    };
    const onPaste = (event: ClipboardEvent) => {
      const file = imageFrom(event.clipboardData?.items);
      if (!file) return;
      event.preventDefault();
      void upload(file);
    };

    dom.addEventListener("drop", onDrop);
    dom.addEventListener("paste", onPaste);
    return () => {
      dom.removeEventListener("drop", onDrop);
      dom.removeEventListener("paste", onPaste);
    };
  }, [editor, upload]);

  const uploadsOff = status.data ? !status.data.configured : false;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border bg-transparent transition-colors focus-within:border-ring",
        invalid && "border-destructive",
      )}
    >
      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_ACCEPT}
        hidden
        onChange={(event) => {
          void upload(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <Toolbar
        editor={editor}
        uploading={uploading}
        uploadsOff={uploadsOff}
        onPickImage={() => fileRef.current?.click()}
        onPickLibrary={() => setPicking(true)}
      />

      <MediaPicker
        open={picking}
        onOpenChange={setPicking}
        folder="content"
        title="Insert an image"
        onSelect={(rows) => {
          const row = rows[0];
          if (row && editor) {
            editor.chain().focus().setImage({ src: row.url, alt: row.alt ?? row.filename }).run();
          }
        }}
      />

      <div style={{ minHeight }} className="cursor-text" onClick={() => editor?.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>

      <p className="border-t bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
        Markdown is stored as written — headings, lists, links and images.
        {uploadsOff ? " Image uploads turn on once the R2 keys are set." : " Drag or paste an image to upload it."}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Toolbar({
  editor,
  uploading,
  uploadsOff,
  onPickImage,
  onPickLibrary,
}: {
  editor: Editor | null;
  uploading: boolean;
  uploadsOff: boolean;
  onPickImage: () => void;
  onPickLibrary: () => void;
}) {
  if (!editor) return <div className="h-11 border-b bg-muted/40" />;

  const setLink = () => {
    const current = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Link URL", current ?? "https://");
    if (href === null) return;
    if (href.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-1.5 py-1.5">
      <Tool label="Bold" icon={Bold} active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
      <Tool label="Italic" icon={Italic} active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <Tool label="Strikethrough" icon={Strikethrough} active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />
      <Tool label="Inline code" icon={Code} active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} />

      <Divider />
      <Tool label="Heading 2" icon={Heading2} active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      <Tool label="Heading 3" icon={Heading3} active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />

      <Divider />
      <Tool label="Bullet list" icon={List} active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <Tool label="Numbered list" icon={ListOrdered} active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <Tool label="Quote" icon={Quote} active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      <Tool label="Divider" icon={Minus} onClick={() => editor.chain().focus().setHorizontalRule().run()} />

      <Divider />
      <Tool label="Add link" icon={Link2} active={editor.isActive("link")} onClick={setLink} />
      <Tool label="Remove link" icon={Link2Off} disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()} />
      <Tool
        label={uploadsOff ? "Image uploads are not configured" : "Upload an image"}
        icon={uploading ? Loader2 : ImagePlus}
        spin={uploading}
        disabled={uploadsOff || uploading}
        onClick={onPickImage}
      />
      <Tool label="Insert from media library" icon={Library} onClick={onPickLibrary} />

      <Divider />
      <Tool label="Undo" icon={Undo2} disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} />
      <Tool label="Redo" icon={Redo2} disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} />
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-border" />;
}

function Tool({
  label,
  icon: Icon,
  active,
  disabled,
  spin,
  onClick,
}: {
  label: string;
  icon: typeof Bold;
  active?: boolean;
  disabled?: boolean;
  spin?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn("size-8", active && "bg-accent text-accent-foreground")}
    >
      <Icon className={cn("h-4 w-4", spin && "animate-spin")} />
    </Button>
  );
}
