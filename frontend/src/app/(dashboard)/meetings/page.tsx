"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMeetings, useCreateMeeting } from "@/hooks/useMeetings";
import { useAuthStore } from "@/stores/authStore";
import type { Meeting } from "@/types/api";
import PageHeader from "@/components/layout/PageHeader";
import { markdownToHtml } from "@/lib/markdown";
import api from "@/lib/api";
import { toast } from "sonner";

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

interface ImportItem {
  id: string;
  file: File | null;
  title: string;
  meeting_date: string;
  description: string;
  status: ImportStatus;
}

function makeItem(): ImportItem {
  return {
    id: crypto.randomUUID(),
    file: null,
    title: "",
    meeting_date: "",
    description: "",
    status: "idle",
  };
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
  const createMeeting = useCreateMeeting();

  const [items, setItems] = useState<ImportItem[]>([makeItem()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateItem(id: string, patch: Partial<ImportItem>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function handleFileChange(
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const title = file.name.replace(/\.(md|txt)$/i, "").replace(/[-_]/g, " ");
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, file, title: item.title || title }
          : item
      )
    );
    e.target.value = "";
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
    onOpenChange(false);
  }

  async function handleSubmit() {
    // Validate
    for (const item of items) {
      if (!item.title.trim()) {
        toast.error("Semua judul meeting wajib diisi");
        return;
      }
      if (!item.meeting_date) {
        toast.error("Semua tanggal meeting wajib diisi");
        return;
      }
      if (!item.file) {
        toast.error("Semua baris wajib memiliki file .md");
        return;
      }
    }

    setIsSubmitting(true);

    let lastMeetingId: number | null = null;
    let successCount = 0;
    let failCount = 0;

    for (const item of items) {
      updateItem(item.id, { status: "uploading" });
      try {
        const meetingRes = await createMeeting.mutateAsync({
          title: item.title.trim(),
          meeting_date: item.meeting_date,
          description: item.description.trim() || undefined,
          location_type: "offline",
        });
        const meetingId: number =
          meetingRes.data?.id ?? meetingRes.data?.data?.id;

        const md = await item.file!.text();
        const html = markdownToHtml(md);

        await api.post(`/api/v1/meetings/${meetingId}/notes`, {
          content: null,
          content_html: html,
        });

        updateItem(item.id, { status: "done" });
        lastMeetingId = meetingId;
        successCount++;
      } catch {
        updateItem(item.id, { status: "error" });
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
      handleClose();
      if (lastMeetingId) router.push(`/meetings/${lastMeetingId}/notes`);
    } else if (successCount > 0) {
      toast.warning(
        `${successCount} berhasil, ${failCount} gagal. Periksa baris yang merah.`
      );
    } else {
      toast.error("Semua import gagal. Coba lagi.");
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
            yang diekspor dari Notion. Klik <strong>Tambah Baris</strong> untuk
            menambah meeting lain.
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
  onUpdate,
  onRemove,
  canRemove,
}: {
  item: ImportItem;
  index: number;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdate: (patch: Partial<ImportItem>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const localFileRef = useRef<HTMLInputElement>(null);

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
          {canRemove && item.status === "idle" && (
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* File picker */}
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
          {item.file ? (
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-background overflow-hidden min-w-0">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium truncate flex-1 min-w-0">
                {item.file.name}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {(item.file.size / 1024).toFixed(1)} KB
              </span>
              {item.status === "idle" && (
                <button
                  type="button"
                  onClick={() => onUpdate({ file: null })}
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
          Gagal mengimpor. Periksa data dan coba lagi.
        </p>
      )}
    </div>
  );
}

// ─── MeetingsPage ─────────────────────────────────────────────────────────────

export default function MeetingsPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  const canCreate =
    user?.roles?.includes("admin") ||
    user?.roles?.includes("super-admin") ||
    user?.roles?.includes("noter");

  const { data, isLoading } = useMeetings({ search });

  const meetings: Meeting[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <ImportNotionDialog open={importOpen} onOpenChange={setImportOpen} />

      <PageHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
            <p className="text-white/80">
              Kelola rapat dan catatan meeting tim.
            </p>
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari meeting..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Meeting Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <MeetingCardSkeleton key={i} />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">Belum ada meeting</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? "Tidak ada meeting yang cocok dengan pencarian."
                : "Buat meeting pertama Anda untuk mulai mencatat."}
            </p>
            {canCreate && !search && (
              <Button asChild className="mt-4">
                <Link href="/meetings/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Meeting
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}