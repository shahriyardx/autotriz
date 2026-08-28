"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crop as CropIcon,
  ExternalLink,
  FolderInput,
  FolderPlus,
  ImageUp,
  Loader2,
  Pencil,
  Search,
  SquareCheck,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui-kit/badge";
import { Button } from "@/components/ui-kit/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui-kit/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui-kit/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui-kit/context-menu";
import { Field, FieldDescription, FieldLabel } from "@/components/ui-kit/field";
import { Input } from "@/components/ui-kit/input";
import { Textarea } from "@/components/ui-kit/textarea";
import {
  IMAGE_ACCEPT,
  readImageSize,
  useMediaUpload,
  type UploadedMedia,
} from "@/components/admin/media/use-upload";
import { cn } from "@/lib/cn";

/* ==================================================================
   The media library: a grid of everything uploaded, with a details
   panel for renaming, alt text, cropping, copying the URL and delete.

   `MediaLibrary` is the /admin/media page. `MediaPicker` is the same
   grid in a dialog, used wherever a file has to be chosen.
   ================================================================== */

export type MediaRow = UploadedMedia & {
  folder: string;
  uploadedBy?: string | null;
  createdAt: Date | string;
};

/** Copies text and reports failure once, in one place. */
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Link copied");
  } catch {
    toast.error("Could not copy — select the URL and copy it by hand.");
  }
}

const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/* ------------------------------------------------------------------ */

export function MediaLibrary() {
  return <MediaGrid manage />;
}

/* ------------------------------------------------------------------ */

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  folder = "products",
  title = "Select an image",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (items: MediaRow[]) => void;
  multiple?: boolean;
  folder?: string;
  title?: string;
}) {
  const [picked, setPicked] = useState<MediaRow[]>([]);

  // Start clean each time the dialog opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setPicked([]);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Click to select. {multiple ? "Shift-click for a range, ⌘/Ctrl-click to add one. " : ""}
            Drop a file to upload it first.
          </DialogDescription>
        </DialogHeader>

        <MediaGrid
          folder={folder}
          compact
          multiple={multiple}
          selection={picked}
          onSelectionChange={setPicked}
          onUploaded={(rows) => setPicked(multiple ? rows : rows.slice(-1))}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!picked.length}
            onClick={() => {
              onSelect(picked);
              onOpenChange(false);
            }}
          >
            {multiple && picked.length > 1 ? `Use ${picked.length} images` : "Use image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */

function MediaGrid({
  selection: selectionProp,
  onSelectionChange: onSelectionChangeProp,
  onUploaded,
  folder,
  compact = false,
  manage = false,
  multiple = true,
}: {
  selection?: MediaRow[];
  onSelectionChange?: (rows: MediaRow[]) => void;
  onUploaded?: (rows: MediaRow[]) => void;
  folder?: string;
  compact?: boolean;
  /** The full library page: folders, bulk actions and the details modal. */
  manage?: boolean;
  multiple?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [activeFolder, setActiveFolder] = useState(folder ?? "");
  const [page, setPage] = useState(1);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);
  // A new search or folder starts at page one again.
  const [seenQuery, setSeenQuery] = useState({ debounced, activeFolder });
  if (seenQuery.debounced !== debounced || seenQuery.activeFolder !== activeFolder) {
    setSeenQuery({ debounced, activeFolder });
    setPage(1);
  }

  // Anchor for shift-click range selection.
  const lastClicked = useRef<string | null>(null);
  // The library page keeps its own selection; the picker passes one in.
  const [ownSelection, setOwnSelection] = useState<MediaRow[]>([]);
  const selection = selectionProp ?? ownSelection;
  const onSelectionChange = onSelectionChangeProp ?? setOwnSelection;
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [bulk, setBulk] = useState(false);
  const [newFolder, setNewFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [confirmBulk, setConfirmBulk] = useState(false);

  const utils = api.useUtils();
  const { uploadMany, busy, uploading } = useMediaUpload(activeFolder || folder || "products");
  const list = api.media.library.useQuery({
    search: debounced,
    folder: activeFolder,
    page,
    perPage: compact ? 24 : 48,
  });

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const rows = await uploadMany(files);
      if (rows.length) {
        toast.success(`${rows.length} ${rows.length === 1 ? "file" : "files"} uploaded`);
        onUploaded?.(rows as MediaRow[]);
      }
    },
    [uploadMany, onUploaded],
  );

  const createFolder = api.media.createFolder.useMutation({
    onSuccess: (row) => {
      toast.success(`Folder “${row.name}” created`);
      setNewFolder(false);
      setFolderName("");
      setActiveFolder(row.slug);
      void utils.media.library.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteFolder = api.media.deleteFolder.useMutation({
    onSuccess: () => {
      toast.success("Folder removed. Its files moved to Products.");
      setActiveFolder("");
      void utils.media.library.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const moveToFolder = api.media.moveToFolder.useMutation({
    onSuccess: () => {
      toast.success("Moved");
      onSelectionChange([]);
      void utils.media.library.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const removeMany = api.media.removeMany.useMutation({
    onSuccess: ({ deleted }) => {
      toast.success(`${deleted} ${deleted === 1 ? "file" : "files"} deleted`);
      onSelectionChange([]);
      setConfirmBulk(false);
      void utils.media.library.invalidate();
    },
    onError: (error) => {
      setConfirmBulk(false);
      toast.error(error.message);
    },
  });

  const items = (list.data?.items ?? []) as MediaRow[];
  const folders = list.data?.folders ?? [];
  const checked = new Set(selection.map((r) => r.id));

  /** Click selects one file. Shift-click takes the range from the last
   *  click; ⌘/Ctrl-click adds or removes a single file. */
  const pick = (item: MediaRow, modifiers: { shift?: boolean; meta?: boolean }) => {
    const anchor = lastClicked.current;
    lastClicked.current = item.id;

    // On the library page a click opens the file, unless bulk select is
    // switched on — then clicking picks files for an action instead.
    if (manage && !bulk) {
      setOpenIndex(items.findIndex((i) => i.id === item.id));
      return;
    }

    if (!multiple) {
      onSelectionChange([item]);
      return;
    }

    if (modifiers.shift && anchor && anchor !== item.id) {
      const ids = items.map((i) => i.id);
      const from = ids.indexOf(anchor);
      const to = ids.indexOf(item.id);
      if (from !== -1 && to !== -1) {
        const [start, end] = from < to ? [from, to] : [to, from];
        const run = items.slice(start, end + 1);
        const merged = [...selection];
        for (const row of run) if (!merged.some((r) => r.id === row.id)) merged.push(row);
        onSelectionChange(merged);
        return;
      }
    }

    // In bulk mode every click adds or removes that one file, so a run of
    // clicks builds a selection. Elsewhere (the picker) ⌘/Ctrl does that
    // and a plain click replaces the selection.
    if (bulk || modifiers.meta) {
      onSelectionChange(
        checked.has(item.id)
          ? selection.filter((r) => r.id !== item.id)
          : [...selection, item],
      );
      return;
    }

    onSelectionChange(checked.has(item.id) && selection.length === 1 ? [] : [item]);
  };

  return (
    <div className="grid gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or alt text…"
              aria-label="Search media"
              className="pl-9"
            />
          </div>


          <input
            ref={inputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            hidden
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {manage ? (
            <Button
              type="button"
              variant={bulk ? "default" : "outline"}
              onClick={() => {
                setBulk((on) => !on);
                onSelectionChange([]);
              }}
            >
              <CheckSquare className="h-4 w-4" />
              {bulk ? "Done" : "Bulk select"}
            </Button>
          ) : null}
          <Button type="button" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}
            {busy ? `Uploading ${uploading}…` : "Upload"}
          </Button>
        </div>

        {/* --- folders --- */}
        {manage || folders.length > 1 ? (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <FolderChip label={`All (${list.data?.total ?? 0})`} active={!activeFolder} onClick={() => setActiveFolder("")} />
            {folders.map((f) => (
              <FolderChip
                key={f.slug}
                label={`${f.name} (${f.count})`}
                active={activeFolder === f.slug}
                onClick={() => setActiveFolder(f.slug)}
                onDelete={
                  manage
                    ? () => {
                        if (window.confirm(`Remove the folder “${f.name}”? Its ${f.count} file(s) move to Products.`)) {
                          deleteFolder.mutate({ slug: f.slug });
                        }
                      }
                    : undefined
                }
              />
            ))}
            {manage ? (
              newFolder ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (folderName.trim()) createFolder.mutate({ name: folderName.trim() });
                  }}
                  className="flex items-center gap-1.5"
                >
                  <Input
                    autoFocus
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="h-8 w-40 text-sm"
                  />
                  <Button type="submit" size="sm" disabled={createFolder.isPending}>
                    Add
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setNewFolder(false)}>
                    Cancel
                  </Button>
                </form>
              ) : (
                <Button type="button" size="sm" variant="outline" onClick={() => setNewFolder(true)}>
                  <FolderPlus className="h-4 w-4" />
                  New folder
                </Button>
              )
            ) : null}
          </div>
        ) : null}

        {/* --- bulk actions --- */}
        {manage && bulk ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border bg-muted/40 px-4 py-2.5">
            <span className="label text-muted-foreground">
              {selection.length ? `${selection.length} selected` : "Click files to select them"}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                onSelectionChange(selection.length === items.length ? [] : items)
              }
            >
              {selection.length === items.length ? "Select none" : "Select all"}
            </Button>
            <label className="flex items-center gap-2 text-sm">
              Move to
              <select
                defaultValue=""
                disabled={!selection.length}
                onChange={(e) => {
                  if (!e.target.value) return;
                  moveToFolder.mutate({ ids: selection.map((r) => r.id), folder: e.target.value });
                  e.target.value = "";
                }}
                className="rounded-sm border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
              >
                <option value="">Choose a folder…</option>
                {folders.map((f) => (
                  <option key={f.slug} value={f.slug}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive"
              disabled={!selection.length}
              onClick={() => setConfirmBulk(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => onSelectionChange([])}>
              Clear
            </Button>
          </div>
        ) : null}

        <div
          onDragOver={(e) => {
            // Ignore drags that started inside the page (a thumbnail being
            // dragged around); only real files from the desktop count.
            if (!e.dataTransfer.types.includes("Files")) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            if (!e.dataTransfer.types.includes("Files")) return;
            e.preventDefault();
            setDragging(false);
            void handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "mt-5 rounded-lg border-2 border-dashed p-3 transition-colors",
            dragging ? "border-primary bg-muted/40" : "border-transparent",
          )}
        >
          {list.isLoading ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
          ) : items.length ? (
            <ul
              className={cn(
                "grid gap-3",
                compact
                  ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6"
                  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
              )}
            >
              {items.map((item) => {
                const ticked = checked.has(item.id);
                const tile = (
                  <button
                    type="button"
                    aria-pressed={ticked}
                    onClick={(event) =>
                      pick(item, { shift: event.shiftKey, meta: event.metaKey || event.ctrlKey })
                    }
                    className={cn(
                      "group relative block w-full overflow-hidden rounded-lg border bg-muted text-left transition-colors",
                      ticked ? "border-primary ring-2 ring-primary" : "hover:border-foreground/30",
                    )}
                  >
                    <span className="relative block aspect-square">
                      <Image
                        src={item.url}
                        alt={item.alt ?? ""}
                        fill
                        draggable={false}
                        sizes="240px"
                        className="object-cover"
                      />
                      {ticked ? (
                        <>
                          <span aria-hidden className="absolute inset-0 bg-primary/20" />
                          <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        </>
                      ) : null}
                    </span>
                    <span className="block truncate px-2.5 py-2 text-xs text-foreground">
                      {item.filename}
                    </span>
                  </button>
                );

                if (!manage) return <li key={item.id}>{tile}</li>;

                return (
                  <li key={item.id}>
                    <ContextMenu>
                      <ContextMenuTrigger asChild>{tile}</ContextMenuTrigger>
                      <ContextMenuContent className="w-56">
                        <ContextMenuItem
                          onSelect={() => setOpenIndex(items.findIndex((i) => i.id === item.id))}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit details
                        </ContextMenuItem>
                        <ContextMenuItem onSelect={() => void copyToClipboard(item.url)}>
                          <Copy className="h-4 w-4" />
                          Copy file URL
                        </ContextMenuItem>
                        <ContextMenuItem asChild>
                          <a href={item.url} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            Open in a new tab
                          </a>
                        </ContextMenuItem>

                        <ContextMenuSeparator />

                        <ContextMenuItem
                          onSelect={() => {
                            if (!bulk) setBulk(true);
                            if (!checked.has(item.id)) onSelectionChange([...selection, item]);
                          }}
                        >
                          <SquareCheck className="h-4 w-4" />
                          {ticked ? "Selected" : "Add to selection"}
                        </ContextMenuItem>

                        <ContextMenuSub>
                          <ContextMenuSubTrigger>
                            <FolderInput className="h-4 w-4" />
                            Move to folder
                          </ContextMenuSubTrigger>
                          <ContextMenuSubContent>
                            {folders.map((f) => (
                              <ContextMenuItem
                                key={f.slug}
                                disabled={f.slug === item.folder}
                                onSelect={() =>
                                  moveToFolder.mutate({
                                    ids: selection.length && checked.has(item.id)
                                      ? selection.map((r) => r.id)
                                      : [item.id],
                                    folder: f.slug,
                                  })
                                }
                              >
                                {f.name}
                              </ContextMenuItem>
                            ))}
                          </ContextMenuSubContent>
                        </ContextMenuSub>

                        <ContextMenuSeparator />

                        <ContextMenuItem
                          variant="destructive"
                          onSelect={() => {
                            if (!checked.has(item.id)) onSelectionChange([item]);
                            setConfirmBulk(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {debounced ? "Nothing matches that search." : "No files yet."}
              </p>
              <Button type="button" variant="outline" className="mt-4" onClick={() => inputRef.current?.click()}>
                <ImageUp className="h-4 w-4" />
                Upload your first file
              </Button>
            </div>
          )}
        </div>

        {(list.data?.pages ?? 1) > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="label text-muted-foreground">
              Page {list.data?.page} of {list.data?.pages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= (list.data?.pages ?? 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>

      {manage && openIndex !== null && items[openIndex] ? (
        <MediaDetailsDialog
          item={items[openIndex]}
          index={openIndex}
          count={items.length}
          onNavigate={(delta) =>
            setOpenIndex((i) => {
              if (i === null) return i;
              const next = i + delta;
              return next < 0 || next >= items.length ? i : next;
            })
          }
          onClose={() => setOpenIndex(null)}
          onDeleted={() => setOpenIndex(null)}
        />
      ) : null}

      <AlertDialog open={confirmBulk} onOpenChange={setConfirmBulk}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selection.length} {selection.length === 1 ? "file" : "files"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They are removed from storage and from anything using them. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => removeMany.mutate({ ids: selection.map((r) => r.id) })}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FolderChip({
  label,
  active,
  onClick,
  onDelete,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  onDelete?: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border text-xs transition-colors",
        active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground",
      )}
    >
      <button type="button" onClick={onClick} className="px-3 py-1.5">
        {label}
      </button>
      {onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Remove folder ${label}`}
          className="pr-2 opacity-60 transition-opacity hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------ */

function MediaDetailsDialog({
  item,
  index,
  count,
  onNavigate,
  onClose,
  onDeleted,
}: {
  item: MediaRow;
  index: number;
  count: number;
  onNavigate: (delta: 1 | -1) => void;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const utils = api.useUtils();
  const [filename, setFilename] = useState(item.filename);
  const [alt, setAlt] = useState(item.alt ?? "");
  const [title, setTitle] = useState(item.title ?? "");
  const [cropping, setCropping] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(item.url);
  // Cropping replaces the object, so the key changes under us. Keeping it
  // here stops a second crop from reading the file that was just deleted.
  const [key, setKey] = useState(item.key);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(
    item.width && item.height ? { w: item.width, h: item.height } : null,
  );

  // Moving to another file resets the form, without an effect.
  const [seenId, setSeenId] = useState(item.id);
  if (seenId !== item.id) {
    setSeenId(item.id);
    setFilename(item.filename);
    setAlt(item.alt ?? "");
    setTitle(item.title ?? "");
    setPreview(item.url);
    setKey(item.key);
    setDimensions(item.width && item.height ? { w: item.width, h: item.height } : null);
    setCropping(false);
  }

  const usage = api.media.usage.useQuery({ id: item.id });

  const update = api.media.update.useMutation({
    onSuccess: ({ url }) => {
      toast.success("Saved");
      setPreview(url);
      // A rename moves the object; re-read the row to pick up the new key.
      void utils.media.library.invalidate();
      void utils.media.byIds.fetch({ ids: [item.id] }).then((rows) => {
        if (rows[0]) setKey(rows[0].key);
      });
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = api.media.removeFromLibrary.useMutation({
    onSuccess: () => {
      toast.success("File deleted");
      setConfirmDelete(false);
      onDeleted();
      void utils.media.library.invalidate();
    },
    onError: (error) => {
      setConfirmDelete(false);
      toast.error(error.message);
    },
  });

  const dirty =
    filename !== item.filename || alt !== (item.alt ?? "") || title !== (item.title ?? "");

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(preview);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy — select the URL and copy it by hand.");
    }
  };

  const used = (usage.data?.products.length ?? 0) + (usage.data?.categories.length ?? 0);
  const uploaded = new Date(item.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-5xl"
      >
        <DialogHeader className="flex-row items-center justify-between gap-4 border-b px-6 py-4">
          <DialogTitle className="text-lg">File details</DialogTitle>
          <DialogDescription className="sr-only">
            Edit this file&apos;s name, alt text and title, crop it, or delete it.
          </DialogDescription>
          <div className="flex items-center gap-1">
            <span className="mr-2 text-xs tabular-nums text-muted-foreground">
              {index + 1} of {count}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Previous file"
              disabled={index <= 0}
              onClick={() => onNavigate(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Next file"
              disabled={index >= count - 1}
              onClick={() => onNavigate(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Close" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid max-h-[calc(92vh-8.5rem)] overflow-y-auto md:grid-cols-[minmax(0,1fr)_22rem]">
          {/* ---------------- preview / cropper ---------------- */}
          <div className="flex flex-col gap-4 border-b p-6 md:border-b-0 md:border-r">
            {cropping ? (
              <CropPane
                item={{ ...item, url: preview, key }}
                onCancel={() => setCropping(false)}
                onDone={(next) => {
                  setPreview(next.url);
                  setKey(next.key);
                  if (next.size) setDimensions(next.size);
                  setCropping(false);
                }}
              />
            ) : (
              <>
                <div className="relative aspect-[4/3] overflow-hidden rounded-md border bg-muted">
                  <Image
                    src={preview}
                    alt={alt || item.filename}
                    fill
                    sizes="(min-width: 768px) 60vw, 100vw"
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button type="button" variant="outline" onClick={() => setCropping(true)}>
                    <CropIcon className="h-4 w-4" />
                    Crop image
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <a href={preview} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Open full size
                    </a>
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* ---------------- info + fields ---------------- */}
          <div className="space-y-5 p-6">
            <dl className="space-y-1.5 border-b pb-5 text-sm">
              <Row label="Uploaded on" value={uploaded} />
              {item.uploadedBy ? <Row label="Uploaded by" value={item.uploadedBy} /> : null}
              <Row label="File name" value={`${item.filename}.${item.mimeType.replace("image/", "")}`} />
              <Row label="File type" value={item.mimeType} />
              <Row label="File size" value={formatBytes(item.size)} />
              {dimensions ? (
                <Row label="Dimensions" value={`${dimensions.w} by ${dimensions.h} pixels`} />
              ) : null}
              <Row label="Folder" value={item.folder} />
            </dl>

            <Field>
              <FieldLabel htmlFor="media-alt">Alternative text</FieldLabel>
              <Textarea id="media-alt" rows={3} value={alt} onChange={(e) => setAlt(e.target.value)} />
              <FieldDescription>
                Describe what the image shows. Leave empty if it is decorative.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="media-title">Title</FieldLabel>
              <Input id="media-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>

            <Field>
              <FieldLabel htmlFor="media-filename">File name</FieldLabel>
              <Input id="media-filename" value={filename} onChange={(e) => setFilename(e.target.value)} />
              <FieldDescription>
                Renaming moves the file in storage. Everything using it follows.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="media-url">File URL</FieldLabel>
              <div className="flex gap-2">
                <Input id="media-url" readOnly value={preview} className="font-mono text-xs" />
                <Button type="button" variant="outline" size="icon" aria-label="Copy URL" onClick={copyUrl}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </Field>

            {usage.data ? (
              used > 0 ? (
                <div className="rounded-md border bg-muted/40 p-3 text-xs">
                  <p className="font-medium text-foreground">
                    Used in {used} {used === 1 ? "place" : "places"}
                  </p>
                  <ul className="mt-1.5 space-y-0.5 text-muted-foreground">
                    {usage.data.products.map((p) => (
                      <li key={p.id}>{p.name}</li>
                    ))}
                    {usage.data.categories.map((c) => (
                      <li key={c.id}>{c.name} (category)</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Badge variant="outline">Not used anywhere</Badge>
              )
            ) : null}
          </div>
        </div>

        <DialogFooter className="items-center justify-between border-t px-6 py-4 sm:justify-between">
          <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" />
            Delete permanently
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              disabled={!dirty || update.isPending}
              onClick={() => update.mutate({ id: item.id, filename, alt: alt || null, title: title || null })}
            >
              {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </div>
        </DialogFooter>

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {item.filename}?</AlertDialogTitle>
              <AlertDialogDescription>
                {used > 0
                  ? `This file is used in ${used} ${used === 1 ? "place" : "places"}. Deleting removes it from them too.`
                  : "The file is removed from storage. This cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => remove.mutate({ id: item.id })}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}:</dt>
      <dd className="min-w-0 break-all">{value}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------
   Crop — the cropped result is uploaded as a new object, then the
   library row is pointed at it, so every reference follows.
   ------------------------------------------------------------------ */

const RATIOS = [
  { label: "Free", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "16:9", value: 16 / 9 },
] as const;

function CropPane({
  item,
  onCancel,
  onDone,
}: {
  item: MediaRow;
  onCancel: () => void;
  onDone: (next: { url: string; key: string; size: { w: number; h: number } | null }) => void;
}) {
  const utils = api.useUtils();
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completed, setCompleted] = useState<PixelCrop | null>(null);
  const [ratio, setRatio] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [natural, setNatural] = useState<{ w: number; h: number; shown: number } | null>(null);

  const createUploadUrl = api.media.createUploadUrl.useMutation();
  const replaceFile = api.media.replaceFile.useMutation();

  /** Starts with almost the whole image selected, centred. */
  const reset = (width: number, height: number, aspect?: number) => {
    setCrop(
      aspect
        ? centerCrop(makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height), width, height)
        : centerCrop({ unit: "%" as const, width: 90, height: 90, x: 0, y: 0 }, width, height),
    );
  };

  const chooseRatio = (value?: number) => {
    setRatio(value);
    const img = imgRef.current;
    if (img) reset(img.width, img.height, value);
  };

  async function apply() {
    const img = imgRef.current;
    if (!completed?.width || !completed.height || !img) return;
    setSaving(true);
    try {
      // The crop is in displayed pixels; scale it back to the original.
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      const blob = await cropToBlob(
        img,
        {
          x: completed.x * scaleX,
          y: completed.y * scaleY,
          width: completed.width * scaleX,
          height: completed.height * scaleY,
        },
        item.mimeType,
      );
      const size = await readImageSize(blob);

      const target = await createUploadUrl.mutateAsync({
        filename: `${item.filename}.${item.mimeType.replace("image/", "")}`,
        contentType: item.mimeType as "image/jpeg",
        size: blob.size,
        prefix: item.folder,
      });
      const response = await fetch(target.url, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": item.mimeType },
      });
      if (!response.ok) throw new Error(`Upload failed (${response.status})`);

      const saved = await replaceFile.mutateAsync({
        id: item.id,
        key: target.key,
        size: blob.size,
        width: size?.width ?? null,
        height: size?.height ?? null,
      });

      toast.success("Image cropped");
      void utils.media.library.invalidate();
      onDone({
        url: saved.url,
        key: saved.key,
        size: size ? { w: size.width, h: size.height } : null,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not crop the image");
    } finally {
      setSaving(false);
    }
  }

  const scale = natural && natural.shown ? natural.w / natural.shown : 1;
  const pixels = completed
    ? { w: Math.round(completed.width * scale), h: Math.round(completed.height * scale) }
    : null;

  return (
    <div className="space-y-4">
      <div className="flex max-h-[60vh] min-h-[18rem] items-center justify-center overflow-auto rounded-md border bg-muted p-3">
        {!natural ? (
          <span className="text-sm text-muted-foreground">Loading image…</span>
        ) : null}
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={setCompleted}
          aspect={ratio}
          keepSelection
          ruleOfThirds
          className={cn("w-full", !natural && "hidden")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/* Read through our own origin rather than the CDN: a canvas
              cannot use a cross-origin image whose response was cached
              without CORS headers, which is what blanked the cropper. */}
          <img
            ref={imgRef}
            src={`/api/media/raw?key=${encodeURIComponent(item.key)}`}
            alt=""
            onError={() =>
              toast.error(
                "That file is missing from storage, so it cannot be cropped. Delete the entry and upload it again.",
              )
            }
            onLoad={(e) => {
              const img = e.currentTarget;
              setNatural({ w: img.naturalWidth, h: img.naturalHeight, shown: img.width });
              reset(img.width, img.height, ratio);
            }}
            /* Full width so the crop view matches the preview size. No
               object-fit here: the crop maps to the element box, so any
               letterboxing would shift the selection. */
            className="h-auto w-full"
          />
        </ReactCrop>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {RATIOS.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => chooseRatio(r.value)}
              className={cn(
                "rounded-sm border px-3 py-1.5 text-xs transition-colors",
                ratio === r.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        {pixels ? (
          <p className="text-xs tabular-nums text-muted-foreground">
            {pixels.w} × {pixels.h} px
          </p>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Drag inside the image to move the selection, or pull a corner to resize
        it. The cropped file replaces this one everywhere it is used.
      </p>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" disabled={!completed?.width || saving} onClick={apply}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Apply crop
        </Button>
      </div>
    </div>
  );
}

/** Draws the selected region to a canvas and returns it as a file blob. */
async function cropToBlob(
  image: HTMLImageElement,
  area: { x: number; y: number; width: number; height: number },
  mimeType: string,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the cropped image"))),
      mimeType,
      0.92,
    );
  });
}
