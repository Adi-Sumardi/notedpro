"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMeetings, useImportMeeting } from "@/hooks/useMeetings";
import { useAuthStore } from "@/stores/authStore";
import type { Meeting } from "@/types/api";
import PageHeader from "@/components/layout/PageHeader";
import {
  markdownToHtml,
  extractLocalImageRefs,
  rewriteImageSrcs,
  extractMeetingDateTime,
} from "@/lib/markdown";
import api from "@/lib/api";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  MapPin,
  Users,
  ListChecks,
  Plus,
  Search,
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FilterX,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";

const statusColorMap: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  in_progress: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  completed: "bg-green-100 text-green-700 hover:bg-green-100",
};

const statusLabelMap: Record<string, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
};

function MeetingCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="mt-2 h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const meetingDate = meeting.meeting_date
    ? format(parseISO(meeting.meeting_date), "EEEE, dd MMMM yyyy - HH:mm", {
        locale: localeId,
      })
    : "-";

  const participantsCount = meeting.participants?.length ?? 0;
  const followUpsCount = meeting.follow_ups_count ?? 0;

  return (
    <Link href={`/meetings/${meeting.id}`}>
      <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight line-clamp-2">
              {meeting.title}
            </CardTitle>
            <Badge
              variant="secondary"
              className={statusColorMap[meeting.status] ?? ""}
            >
              {statusLabelMap[meeting.status] ?? meeting.status}
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-1.5 mt-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {meetingDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {meeting.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{meeting.location}</span>
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>{participantsCount} peserta</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" />
              <span>{followUpsCount} follow-up</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ImportStatus = "idle" | "uploading" | "done" | "error";
type ImportSource = "file" | "notion";

interface ImportItem {
  id: string;
  sourceType: ImportSource;
  file: File | null;
  fileName: string | null;
  /** Raw markdown text, read from the file as soon as it's selected — kept in
   *  state (and persisted to localStorage) so the row can still be submitted
   *  even if the browser drops the original File handle across a refresh. */
  fileText: string | null;
  /** Optional images referenced by the markdown (e.g. Notion's exported
   *  "assets" folder), matched by filename and uploaded after the meeting
   *  + note are saved. Not persisted to the localStorage draft — File
   *  objects aren't serializable — so a refresh only loses the images,
   *  never the note text itself. */
  imageFiles: File[];
  /** Raw link or page ID pasted by the user when sourceType is "notion". */
  notionSource: string;
  /** HTML already resolved from the Notion API via /notion/preview — images
   *  referenced in it are already downloaded server-side, so (unlike the
   *  file-upload path) nothing further needs to be uploaded at submit time. */
  notionContentHtml: string | null;
  isResolvingNotion?: boolean;
  title: string;
  meeting_date: string;
  description: string;
  status: ImportStatus;
  errorMessage?: string;
  /** Set when the meeting+note saved fine but some images failed to upload/match. */
  warningMessage?: string;
}

function makeItem(): ImportItem {
  return {
    id: crypto.randomUUID(),
    sourceType: "file",
    file: null,
    fileName: null,
    fileText: null,
    imageFiles: [],
    notionSource: "",
    notionContentHtml: null,
    title: "",
    meeting_date: "",
    description: "",
    status: "idle",
  };
}

/** Notion markdown exports are named "<Title> <32-char-hex-page-id>.md" —
 *  strip that id suffix so auto-filled titles stay readable. */
function titleFromFileName(name: string): string {
  return name
    .replace(/\.(md|txt)$/i, "")
    .replace(/\s+[0-9a-f]{32}$/i, "")
    .replace(/[-_]/g, " ")
    .trim();
}

const IMPORT_DRAFT_KEY = "notedpro:meetings-import-draft";

type PersistedImportItem = Omit<ImportItem, "file" | "imageFiles" | "status"> & {
  status: ImportStatus;
};

function loadDraft(): ImportItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(IMPORT_DRAFT_KEY);
    if (!raw) return null;
    const parsed: PersistedImportItem[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    // File objects can't survive serialization — rows still show their
    // fileName/fileText but "uploading" rows revert to "idle" so they can be retried.
    // Any referenced images have to be re-attached, since File[] can't be persisted either.
    return parsed.map((p) => ({
      ...p,
      file: null,
      imageFiles: [],
      isResolvingNotion: false,
      status: p.status === "uploading" ? "idle" : p.status,
    }));
  } catch {
    return null;
  }
}

function saveDraft(items: ImportItem[]) {
  if (typeof window === "undefined") return;
  const hasContent = items.some(
    (i) => i.title || i.fileText || i.description || i.notionSource || i.notionContentHtml
  );
  if (!hasContent) {
    window.localStorage.removeItem(IMPORT_DRAFT_KEY);
    return;
  }
  const toStore: PersistedImportItem[] = items.map((item) => ({
    id: item.id,
    sourceType: item.sourceType,
    fileName: item.fileName,
    fileText: item.fileText,
    notionSource: item.notionSource,
    notionContentHtml: item.notionContentHtml,
    title: item.title,
    meeting_date: item.meeting_date,
    description: item.description,
    status: item.status,
    errorMessage: item.errorMessage,
    warningMessage: item.warningMessage,
  }));
  window.localStorage.setItem(IMPORT_DRAFT_KEY, JSON.stringify(toStore));
}

function clearDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(IMPORT_DRAFT_KEY);
}

function extractErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    if (data?.errors) {
      const first = Object.values(data.errors)[0]?.[0];
      if (first) return first;
    }
    if (data?.message) return data.message;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Gagal mengimpor. Periksa data dan coba lagi.";
}

/**
 * Uploads any selected image files that match an `![alt](src)` reference in
 * the imported markdown (matched by filename, since Notion's relative paths
 * are usually just "assets/<name>.png"), then rewrites the note's saved
 * content_html to point at the real uploaded URLs. Returns a human-readable
 * warning if some images couldn't be matched/uploaded, or undefined if
 * everything succeeded (or there was nothing to do).
 */
async function uploadImagesAndPatchNote(
  meetingId: number,
  noteId: number,
  html: string,
  mdText: string,
  imageFiles: File[]
): Promise<string | undefined> {
  const refs = extractLocalImageRefs(mdText);
  if (refs.length === 0) return undefined;

  const basename = (p: string) => p.split("/").pop()?.toLowerCase() ?? p.toLowerCase();
  const filesByName = new Map(imageFiles.map((f) => [f.name.toLowerCase(), f]));

  const srcMap: Record<string, string> = {};
  let unmatched = 0;
  let uploadFailed = 0;

  for (const ref of refs) {
    const match = filesByName.get(basename(ref));
    if (!match) {
      unmatched++;
      continue;
    }
    try {
      const form = new FormData();
      form.append("image", match);
      const res = await api.post(
        `/api/v1/meetings/${meetingId}/notes/images`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const url: string | undefined = res.data?.data?.url;
      if (url) srcMap[ref] = url;
      else uploadFailed++;
    } catch {
      uploadFailed++;
    }
  }

  if (Object.keys(srcMap).length > 0) {
    const patchedHtml = rewriteImageSrcs(html, srcMap);
    try {
      await api.put(`/api/v1/meetings/${meetingId}/notes/${noteId}`, {
        content: null,
        content_html: patchedHtml,
      });
    } catch {
      return "Gambar berhasil diupload tapi gagal menyimpan catatan yang diperbarui.";
    }
  }

  if (unmatched > 0 || uploadFailed > 0) {
    const parts: string[] = [];
    if (unmatched > 0) parts.push(`${unmatched} gambar tidak ditemukan di file yang dipilih`);
    if (uploadFailed > 0) parts.push(`${uploadFailed} gambar gagal diupload`);
    return `Meeting & catatan tersimpan, tapi ${parts.join(", ")}.`;
  }

  return undefined;
}

// ─── ImportNotionDialog ───────────────────────────────────────────────────────

function ImportNotionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const importMeeting = useImportMeeting();

  const [items, setItems] = useState<ImportItem[]>([makeItem()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore an in-progress draft (survives refresh/tab-close) whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    const draft = loadDraft();
    if (draft && draft.some((i) => i.status !== "done")) {
      setItems(draft);
      toast.info("Draft import sebelumnya dipulihkan. File perlu dipilih ulang kecuali isi sudah tersimpan.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the draft up to date so a refresh/tab-close doesn't wipe out typed data.
  useEffect(() => {
    if (!open) return;
    saveDraft(items);
  }, [items, open]);

  function updateItem(id: string, patch: Partial<ImportItem>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  async function handleFileChange(
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const text = await file.text();
    const title = titleFromFileName(file.name);
    const meetingDate = extractMeetingDateTime(text);

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              file,
              fileName: file.name,
              fileText: text,
              title: item.title || title,
              meeting_date: item.meeting_date || meetingDate || "",
            }
          : item
      )
    );
  }

  function handleImagesChange(
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, imageFiles: [...item.imageFiles, ...files] }
          : item
      )
    );
  }

  function removeImageFile(id: string, fileIndex: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              imageFiles: item.imageFiles.filter((_, i) => i !== fileIndex),
            }
          : item
      )
    );
  }

  function setSourceType(id: string, sourceType: ImportSource) {
    updateItem(id, { sourceType });
  }

  async function resolveNotionSource(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item || !item.notionSource.trim()) {
      toast.error("Tempel link atau ID halaman Notion terlebih dahulu");
      return;
    }

    updateItem(id, { isResolvingNotion: true });
    try {
      const res = await api.post("/api/v1/notion/preview", {
        source: item.notionSource.trim(),
      });
      const data = res.data?.data;
      updateItem(id, {
        notionContentHtml: data.content_html,
        title: item.title || data.title,
        meeting_date: item.meeting_date || data.meeting_date || "",
        isResolvingNotion: false,
      });
      toast.success("Data dari Notion berhasil ditarik");
    } catch (err) {
      updateItem(id, { isResolvingNotion: false });
      toast.error(extractErrorMessage(err));
    }
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      return next.length === 0 ? [makeItem()] : next;
    });
  }

  function addItem() {
    setItems((prev) => [...prev, makeItem()]);
  }

  function handleClose() {
    if (isSubmitting) return;
    setItems([makeItem()]);
    setIsSubmitting(false);
    clearDraft();
    onOpenChange(false);
  }

  async function handleSubmit() {
    // Only process items that haven't succeeded yet
    const pending = items.filter((i) => i.status !== "done");

    // Validate pending items only
    for (const item of pending) {
      if (!item.title.trim()) {
        toast.error("Semua judul meeting wajib diisi");
        return;
      }
      if (!item.meeting_date) {
        toast.error("Semua tanggal meeting wajib diisi");
        return;
      }
      if (item.sourceType === "file" && !item.fileText) {
        toast.error("Semua baris wajib memiliki file .md");
        return;
      }
      if (item.sourceType === "notion" && !item.notionContentHtml) {
        toast.error('Klik "Tarik Data" untuk baris dengan sumber Notion sebelum import');
        return;
      }
    }

    setIsSubmitting(true);

    let lastMeetingId: number | null = null;
    let successCount = 0;
    let failCount = 0;

    for (const item of pending) {
      updateItem(item.id, { status: "uploading", errorMessage: undefined });
      try {
        // Notion-sourced content is already resolved to HTML server-side
        // (with images already downloaded), so it's used as-is. File-sourced
        // content still goes through the local regex markdown converter.
        const html =
          item.sourceType === "notion"
            ? item.notionContentHtml!
            : markdownToHtml(item.fileText!);

        // Meeting + first note are created atomically on the backend (single
        // DB transaction) — either both are saved, or neither is, so a failed
        // note never leaves behind an empty orphaned meeting.
        const res = await importMeeting.mutateAsync({
          title: item.title.trim(),
          meeting_date: item.meeting_date,
          description: item.description.trim() || undefined,
          location_type: "offline",
          content: null,
          content_html: html,
        });
        const meeting = res.data?.data ?? res.data;
        const meetingId: number = meeting?.id;
        const noteId: number | undefined = meeting?.latest_note?.id;

        // The meeting + note text are already safely saved at this point.
        // Images are uploaded as a best-effort follow-up: any failure here
        // is surfaced as a non-blocking warning, not an import failure.
        // (Not applicable to Notion-sourced rows — images were already
        // downloaded and embedded server-side by the /notion/preview call.)
        let warningMessage: string | undefined;
        if (item.sourceType === "file" && item.imageFiles.length > 0 && meetingId && noteId) {
          warningMessage = await uploadImagesAndPatchNote(
            meetingId,
            noteId,
            html,
            item.fileText!,
            item.imageFiles
          );
        }

        updateItem(item.id, { status: "done", warningMessage });
        lastMeetingId = meetingId;
        successCount++;
      } catch (err) {
        updateItem(item.id, {
          status: "error",
          errorMessage: extractErrorMessage(err),
        });
        failCount++;
      }
    }

    setIsSubmitting(false);

    if (successCount > 0 && failCount === 0) {
      toast.success(
        successCount === 1
          ? "Meeting & catatan berhasil diimpor!"
          : `${successCount} meeting berhasil diimpor!`
      );
      clearDraft();
      handleClose();
      if (lastMeetingId) router.push(`/meetings/${lastMeetingId}/notes`);
    } else if (successCount > 0) {
      toast.warning(
        `${successCount} berhasil, ${failCount} gagal. Periksa baris yang merah.`
      );
    } else {
      toast.error("Semua import gagal. Periksa pesan error di tiap baris.");
    }
  }

  const allDone = items.every((i) => i.status === "done");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Import Catatan dari Notion
          </DialogTitle>
          <DialogDescription>
            Buat satu atau beberapa meeting sekaligus dari file Markdown (.md)
            yang diekspor dari Notion, atau cukup tempel link/ID halaman
            Notion untuk menarik datanya otomatis. Klik{" "}
            <strong>Tambah Baris</strong> untuk menambah meeting lain.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-2">
          {items.map((item, idx) => (
            <ImportItemRow
              key={item.id}
              item={item}
              index={idx}
              onFileChange={(e) => handleFileChange(item.id, e)}
              onImagesChange={(e) => handleImagesChange(item.id, e)}
              onRemoveImage={(fileIndex) => removeImageFile(item.id, fileIndex)}
              onSourceTypeChange={(v) => setSourceType(item.id, v)}
              onResolveNotion={() => resolveNotionSource(item.id)}
              onUpdate={(patch) => updateItem(item.id, patch)}
              onRemove={() => removeItem(item.id)}
              canRemove={items.length > 1}
            />
          ))}
        </div>

        <div className="shrink-0 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 mb-4"
            onClick={addItem}
            disabled={isSubmitting || allDone}
          >
            <Plus className="h-4 w-4" />
            Tambah Baris
          </Button>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || allDone}
              className="gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isSubmitting
                ? "Mengimpor..."
                : items.length === 1
                ? "Import & Buat Meeting"
                : `Import ${items.length} Meeting`}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── ImportItemRow ────────────────────────────────────────────────────────────

function ImportItemRow({
  item,
  index,
  onFileChange,
  onImagesChange,
  onRemoveImage,
  onSourceTypeChange,
  onResolveNotion,
  onUpdate,
  onRemove,
  canRemove,
}: {
  item: ImportItem;
  index: number;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImagesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (fileIndex: number) => void;
  onSourceTypeChange: (v: ImportSource) => void;
  onResolveNotion: () => void;
  onUpdate: (patch: Partial<ImportItem>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const localFileRef = useRef<HTMLInputElement>(null);
  const imagesFileRef = useRef<HTMLInputElement>(null);

  const statusBorder =
    item.status === "done"
      ? "border-green-400 bg-green-50"
      : item.status === "error"
      ? "border-red-400 bg-red-50"
      : item.status === "uploading"
      ? "border-blue-300 bg-blue-50"
      : "border-border";

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-colors relative ${statusBorder}`}
    >
      {/* Row header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-muted-foreground">
          Meeting #{index + 1}
        </span>
        <div className="flex items-center gap-2">
          {item.status === "uploading" && (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          )}
          {item.status === "done" && (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
          {item.status === "error" && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          {canRemove && (item.status === "idle" || item.status === "error") && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-full p-1 hover:bg-muted text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Source type toggle */}
      <div className="flex gap-1.5 mb-3">
        <button
          type="button"
          disabled={item.status !== "idle"}
          onClick={() => onSourceTypeChange("file")}
          className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            item.sourceType === "file"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          Upload file .md
        </button>
        <button
          type="button"
          disabled={item.status !== "idle"}
          onClick={() => onSourceTypeChange("notion")}
          className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            item.sourceType === "notion"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          Tempel link Notion
        </button>
      </div>

      {item.sourceType === "notion" && (
        <div className="grid gap-1.5 mb-3">
          <Label className="text-xs">
            Link atau ID halaman Notion <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://www.notion.so/Meeting-Notes-3a2f1c4d..."
              value={item.notionSource}
              disabled={item.status !== "idle"}
              onChange={(e) =>
                onUpdate({ notionSource: e.target.value, notionContentHtml: null })
              }
            />
            <Button
              type="button"
              variant="outline"
              disabled={item.status !== "idle" || item.isResolvingNotion}
              onClick={onResolveNotion}
              className="shrink-0 gap-1.5"
            >
              {item.isResolvingNotion ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Tarik Data
            </Button>
          </div>
          {item.notionContentHtml && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Data berhasil ditarik dari Notion. Periksa judul & tanggal di bawah, lalu klik Import.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Pastikan halaman ini sudah di-share ke integration Notion aplikasi ini
            (••• → Connections di halaman Notion tersebut).
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* File picker */}
        {item.sourceType === "file" && (
        <>
        <div className="sm:col-span-2 grid gap-1.5">
          <Label className="text-xs">
            File .md dari Notion <span className="text-red-500">*</span>
          </Label>
          <input
            ref={localFileRef}
            type="file"
            accept=".md,.txt"
            className="hidden"
            onChange={onFileChange}
          />
          {item.fileName ? (
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-background overflow-hidden min-w-0">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium truncate flex-1 min-w-0">
                {item.fileName}
              </span>
              {item.file && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {(item.file.size / 1024).toFixed(1)} KB
                </span>
              )}
              {item.status === "idle" && (
                <button
                  type="button"
                  onClick={() => onUpdate({ file: null, fileName: null, fileText: null })}
                  className="rounded-full p-0.5 hover:bg-muted shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-dashed h-12"
              disabled={item.status !== "idle"}
              onClick={() => localFileRef.current?.click()}
            >
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Klik untuk pilih file .md
              </span>
            </Button>
          )}
        </div>

        {/* Image picker (optional) */}
        <div className="sm:col-span-2 grid gap-1.5">
          <Label className="text-xs">
            Gambar/lampiran dari Notion (opsional)
          </Label>
          <input
            ref={imagesFileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onImagesChange}
          />
          {item.imageFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.imageFiles.map((f, i) => (
                <span
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs"
                >
                  {f.name}
                  {item.status === "idle" && (
                    <button
                      type="button"
                      onClick={() => onRemoveImage(i)}
                      className="rounded-full hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto gap-1.5 border-dashed"
            disabled={item.status !== "idle"}
            onClick={() => imagesFileRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Pilih gambar yang direferensikan di catatan (mis. dari folder assets)
            </span>
          </Button>
        </div>
        </>
        )}

        {/* Title */}
        <div className="grid gap-1.5">
          <Label className="text-xs">
            Judul Meeting <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Judul rapat..."
            value={item.title}
            disabled={item.status !== "idle"}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
        </div>

        {/* Date */}
        <div className="grid gap-1.5">
          <Label className="text-xs">
            Tanggal &amp; Waktu <span className="text-red-500">*</span>
          </Label>
          <Input
            type="datetime-local"
            className="[color-scheme:light]"
            value={item.meeting_date}
            disabled={item.status !== "idle"}
            onChange={(e) => onUpdate({ meeting_date: e.target.value })}
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2 grid gap-1.5">
          <Label className="text-xs">Deskripsi (opsional)</Label>
          <Textarea
            placeholder="Agenda atau konteks rapat..."
            rows={2}
            value={item.description}
            disabled={item.status !== "idle"}
            onChange={(e) => onUpdate({ description: e.target.value })}
          />
        </div>
      </div>

      {/* Error message */}
      {item.status === "error" && (
        <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {item.errorMessage || "Gagal mengimpor. Periksa data dan coba lagi."}
        </p>
      )}

      {/* Warning message — meeting/note saved fine, but images had issues */}
      {item.status === "done" && item.warningMessage && (
        <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {item.warningMessage}
        </p>
      )}
    </div>
  );
}

// ─── MeetingsPage ─────────────────────────────────────────────────────────────

export default function MeetingsPage() {
  const { user } = useAuthStore();
  const [importOpen, setImportOpen] = useState(false);

  // ── Filter & pagination state ───────────────────────────────────────────────
  const [search, setSearch]       = useState("");
  const [status, setStatus]       = useState("all");
  const [sortBy, setSortBy]       = useState<"meeting_date" | "created_at">("meeting_date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");
  const [page, setPage]           = useState(1);
  const PER_PAGE = 12;

  // Reset to page 1 whenever filters change
  function resetPage() { setPage(1); }

  const hasActiveFilters = status !== "all" || dateFrom !== "" || dateTo !== "" ||
    sortBy !== "meeting_date" || sortOrder !== "desc";

  function clearFilters() {
    setStatus("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("meeting_date");
    setSortOrder("desc");
    setSearch("");
    setPage(1);
  }

  const params: Record<string, string> = {
    per_page: String(PER_PAGE),
    page: String(page),
    sort_by: sortBy,
    sort_order: sortOrder,
  };
  if (search)             params.search    = search;
  if (status !== "all")   params.status    = status;
  if (dateFrom)           params.date_from = dateFrom;
  if (dateTo)             params.date_to   = dateTo;

  const { data, isLoading } = useMeetings(params);
  const meetings: Meeting[] = data?.data ?? [];
  const meta = data?.meta;

  const canCreate =
    user?.roles?.includes("admin") ||
    user?.roles?.includes("super-admin") ||
    user?.roles?.includes("noter");

  // ── Pagination helpers ──────────────────────────────────────────────────────
  const lastPage   = meta?.last_page ?? 1;
  const totalItems = meta?.total ?? 0;
  const pageStart  = meta ? (page - 1) * PER_PAGE + 1 : 0;
  const pageEnd    = meta ? Math.min(page * PER_PAGE, totalItems) : 0;

  function buildPageNumbers(): (number | "…")[] {
    if (lastPage <= 7) return Array.from({ length: lastPage }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "…", lastPage];
    if (page >= lastPage - 3) return [1, "…", lastPage - 4, lastPage - 3, lastPage - 2, lastPage - 1, lastPage];
    return [1, "…", page - 1, page, page + 1, "…", lastPage];
  }

  return (
    <div className="space-y-6">
      <ImportNotionDialog open={importOpen} onOpenChange={setImportOpen} />

      {/* ── Header ── */}
      <PageHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
            <p className="text-white/80">Kelola rapat dan catatan meeting tim.</p>
          </div>
          {canCreate && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white gap-1.5"
                onClick={() => setImportOpen(true)}
              >
                <Upload className="h-4 w-4" />
                Import Notion
              </Button>
              <Button asChild variant="secondary">
                <Link href="/meetings/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Meeting
                </Link>
              </Button>
            </div>
          )}
        </div>
      </PageHeader>

      {/* ── Filter bar ── */}
      <div className="space-y-3">
        {/* Row 1: search + sort */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari meeting..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              className="pl-9"
            />
          </div>

          {/* Sort by */}
          <Select value={sortBy} onValueChange={(v: "meeting_date" | "created_at") => { setSortBy(v); resetPage(); }}>
            <SelectTrigger className="w-[170px]">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meeting_date">Tanggal Rapat</SelectItem>
              <SelectItem value="created_at">Tanggal Dibuat</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort order */}
          <Select value={sortOrder} onValueChange={(v: "desc" | "asc") => { setSortOrder(v); resetPage(); }}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Terbaru</SelectItem>
              <SelectItem value="asc">Terlama</SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={status} onValueChange={(v) => { setStatus(v); resetPage(); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
              <FilterX className="h-4 w-4" />
              Reset
            </Button>
          )}
        </div>

        {/* Row 2: date range */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground shrink-0">Dari</Label>
            <Input
              type="date"
              className="w-[150px] [color-scheme:light]"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => { setDateFrom(e.target.value); resetPage(); }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground shrink-0">Sampai</Label>
            <Input
              type="date"
              className="w-[150px] [color-scheme:light]"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => { setDateTo(e.target.value); resetPage(); }}
            />
          </div>
          {totalItems > 0 && !isLoading && (
            <span className="text-sm text-muted-foreground ml-auto">
              {pageStart}–{pageEnd} dari {totalItems} meeting
            </span>
          )}
        </div>
      </div>

      {/* ── Meeting Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => <MeetingCardSkeleton key={i} />)}
        </div>
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">Tidak ada meeting ditemukan</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasActiveFilters || search
                ? "Coba ubah filter atau kata kunci pencarian."
                : "Buat meeting pertama untuk mulai mencatat."}
            </p>
            {hasActiveFilters || search ? (
              <Button variant="outline" onClick={clearFilters} className="mt-4 gap-1.5">
                <FilterX className="h-4 w-4" />
                Reset Filter
              </Button>
            ) : canCreate ? (
              <Button asChild className="mt-4">
                <Link href="/meetings/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Meeting
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {buildPageNumbers().map((n, i) =>
            n === "…" ? (
              <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm select-none">…</span>
            ) : (
              <Button
                key={n}
                variant={n === page ? "default" : "outline"}
                size="icon"
                className="h-8 w-8 text-sm"
                onClick={() => setPage(n as number)}
              >
                {n}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}