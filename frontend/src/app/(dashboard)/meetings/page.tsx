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

function ImportNotionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const createMeeting = useCreateMeeting();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    meeting_date: "",
    description: "",
  });
  const [mdFile, setMdFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMdFile(file);
    // Auto-fill title from filename if empty
    if (!form.title) {
      const name = file.name.replace(/\.(md|txt)$/i, "").replace(/[-_]/g, " ");
      setForm((prev) => ({ ...prev, title: name }));
    }
    e.target.value = "";
  }

  function handleClose() {
    setForm({ title: "", meeting_date: "", description: "" });
    setMdFile(null);
    setIsSubmitting(false);
    onOpenChange(false);
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("Judul meeting wajib diisi");
      return;
    }
    if (!form.meeting_date) {
      toast.error("Tanggal meeting wajib diisi");
      return;
    }
    if (!mdFile) {
      toast.error("File catatan dari Notion wajib dipilih");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create the meeting
      const meetingRes = await createMeeting.mutateAsync({
        title: form.title.trim(),
        meeting_date: form.meeting_date,
        description: form.description.trim() || undefined,
        location_type: "offline",
      });
      const meetingId: number = meetingRes.data?.id ?? meetingRes.data?.data?.id;

      // 2. Parse the .md file
      const md = await mdFile.text();
      const html = markdownToHtml(md);

      // 3. Save note with imported content
      await api.post(`/api/v1/meetings/${meetingId}/notes`, {
        content: null,
        content_html: html,
      });

      toast.success("Meeting & catatan berhasil diimpor!");
      handleClose();
      router.push(`/meetings/${meetingId}/notes`);
    } catch {
      toast.error("Gagal mengimpor. Coba lagi.");
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Import Catatan dari Notion
          </DialogTitle>
          <DialogDescription>
            Buat meeting baru sekaligus impor catatannya dari file Markdown
            (.md) yang diekspor dari Notion.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* File upload — shown first so title can be auto-filled */}
          <div className="grid gap-2">
            <Label>
              File Catatan Notion (.md){" "}
              <span className="text-red-500">*</span>
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
            {mdFile ? (
              <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5 bg-muted/30">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{mdFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(mdFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMdFile(null)}
                  className="rounded-full p-1 hover:bg-muted shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-dashed h-20 flex-col"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Klik untuk pilih file .md dari Notion
                </span>
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Di Notion: buka halaman → ··· → Export → Markdown &amp; CSV
            </p>
          </div>

          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="import_title">
              Judul Meeting <span className="text-red-500">*</span>
            </Label>
            <Input
              id="import_title"
              placeholder="Contoh: Rapat Evaluasi Q1 2026"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>

          {/* Date */}
          <div className="grid gap-2">
            <Label htmlFor="import_date">
              Tanggal &amp; Waktu <span className="text-red-500">*</span>
            </Label>
            <Input
              id="import_date"
              type="datetime-local"
              className="[color-scheme:light]"
              value={form.meeting_date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, meeting_date: e.target.value }))
              }
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="import_desc">Deskripsi (opsional)</Label>
            <Textarea
              id="import_desc"
              placeholder="Agenda atau konteks rapat..."
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-1.5">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isSubmitting ? "Mengimpor..." : "Import & Buat Meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
