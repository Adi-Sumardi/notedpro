"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRouteId } from "@/hooks/useRouteId";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

import { useWorkLog, useSubmitWorkLog, useReviewWorkLog, useDeleteWorkLog } from "@/hooks/useWorkLogs";
import { useAuthStore } from "@/stores/authStore";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarDays,
  User as UserIcon,
  Loader2,
  Pencil,
  Send,
  CheckCircle2,
  XCircle,
  Trash2,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  Link2,
  ExternalLink,
  Download,
} from "lucide-react";


const categoryColorMap: Record<string, string> = {
  meeting: "bg-purple-100 text-purple-700",
  development: "bg-blue-100 text-blue-700",
  administrative: "bg-gray-100 text-gray-700",
  research: "bg-yellow-100 text-yellow-700",
  communication: "bg-green-100 text-green-700",
  monitoring: "bg-orange-100 text-orange-700",
  other: "bg-gray-100 text-gray-600",
};

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FileText className="h-5 w-5 text-red-500" />;
  if (["doc", "docx"].includes(ext ?? ""))
    return <FileText className="h-5 w-5 text-blue-500" />;
  if (["xls", "xlsx"].includes(ext ?? ""))
    return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
  if (ext === "pptx")
    return <Presentation className="h-5 w-5 text-orange-500" />;
  if (["jpg", "jpeg", "png"].includes(ext ?? ""))
    return <ImageIcon className="h-5 w-5 text-purple-500" />;
  return <FileText className="h-5 w-5 text-gray-500" />;
}

export default function WorkLogDetailPage() {
  const routeId = useRouteId();
  const router = useRouter();
  const id = Number(routeId);

  const { user, hasRole } = useAuthStore();
  const isReviewer =
    hasRole("admin") || hasRole("super-admin") || hasRole("manager");

  const { data: log, isLoading } = useWorkLog(id);
  const submitLog = useSubmitWorkLog(id);
  const reviewLog = useReviewWorkLog(id);
  const deleteLog = useDeleteWorkLog();

  const [reviewComment, setReviewComment] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold">Laporan Tidak Ditemukan</h2>
        <p className="mt-1 text-muted-foreground">
          Laporan yang Anda cari tidak ada atau telah dihapus.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/work-logs">Kembali</Link>
        </Button>
      </div>
    );
  }

  const isOwner = Number(user?.id) === Number(log.user?.id);
  const canEdit =
    isOwner && (log.status === "draft" || log.status === "rejected");
  const canSubmit = canEdit;
  const canReview = isReviewer && log.status === "submitted";
  const canDelete = isOwner && log.status === "draft";

  async function handleSubmit() {
    try {
      await submitLog.mutateAsync();
      toast.success("Laporan berhasil dilaporkan!");
    } catch {
      toast.error("Gagal mengajukan laporan.");
    }
  }

  async function handleReview(status: "approved" | "rejected") {
    try {
      await reviewLog.mutateAsync({
        status,
        review_comment: reviewComment || undefined,
      });
      toast.success(
        status === "approved"
          ? "Laporan berhasil disetujui."
          : "Laporan berhasil ditolak."
      );
    } catch {
      toast.error("Gagal mereview laporan.");
    }
  }

  async function handleDelete() {
    try {
      await deleteLog.mutateAsync(id);
      toast.success("Laporan berhasil dihapus.");
      router.push("/work-logs");
    } catch {
      toast.error("Gagal menghapus laporan.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                Laporan Harian
              </h1>
              <Badge
                variant="secondary"
                className="bg-white/20 text-white hover:bg-white/20"
              >
                {log.status_label}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {new Date(log.log_date).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <UserIcon className="h-4 w-4" />
                {log.user?.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/work-logs/${id}/edit`}>
                  <Pencil className="mr-1.5 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            )}
            {canSubmit && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSubmit}
                disabled={submitLog.isPending}
              >
                {submitLog.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-4 w-4" />
                )}
                Laporkan
              </Button>
            )}
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleteLog.isPending}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Hapus
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Laporan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Yakin ingin menghapus laporan harian ini? Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Ya, Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </PageHeader>

      {/* Notes */}
      {log.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Catatan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{log.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kegiatan</CardTitle>
          <CardDescription>{log.items?.length ?? 0} kegiatan</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="w-[140px]">Kategori</TableHead>
                <TableHead className="w-[120px]">Waktu</TableHead>
                <TableHead className="w-[100px]">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(log.items ?? []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-pre-wrap">
                    {item.description}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={categoryColorMap[item.category] ?? ""}
                    >
                      {item.category_label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.start_time} - {item.end_time}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {item.progress}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader>
          <CardTitle>Lampiran</CardTitle>
          <CardDescription>
            {(log.attachments?.length ?? 0) > 0
              ? `${log.attachments!.length} lampiran`
              : "Belum ada lampiran"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(!log.attachments || log.attachments.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <FileText className="h-8 w-8 mb-2" />
              <p className="text-sm">Tidak ada file atau link yang dilampirkan.</p>
            </div>
          ) : (
            <>
              {log.attachments
                .filter((a) => a.type === "file")
                .map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2"
                  >
                    {getFileIcon(att.original_name ?? "file")}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {att.original_name}
                      </p>
                      {att.file_size && (
                        <p className="text-xs text-muted-foreground">
                          {(att.file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                    {att.file_url && (
                      <a
                        href={att.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted shrink-0"
                      >
                        <Download className="h-4 w-4" />
                        Unduh
                      </a>
                    )}
                  </div>
                ))}
              {log.attachments
                .filter((a) => a.type === "link")
                .map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2"
                  >
                    <Link2 className="h-5 w-5 text-blue-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {att.label || att.url}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {att.url}
                      </p>
                    </div>
                    <a
                      href={att.url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Buka
                    </a>
                  </div>
                ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* Review Info */}
      {log.reviewed_at && (
        <Card>
          <CardHeader>
            <CardTitle>Hasil Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              <span className="text-muted-foreground">Reviewer:</span>{" "}
              {log.reviewer?.name}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Tanggal:</span>{" "}
              {new Date(log.reviewed_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {log.review_comment && (
              <p className="text-sm">
                <span className="text-muted-foreground">Komentar:</span>{" "}
                {log.review_comment}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review Form */}
      {canReview && (
        <Card>
          <CardHeader>
            <CardTitle>Review Laporan</CardTitle>
            <CardDescription>
              Berikan persetujuan atau tolak laporan ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Komentar (opsional)</Label>
              <Textarea
                placeholder="Tulis komentar review..."
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleReview("approved")}
                disabled={reviewLog.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {reviewLog.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                )}
                Setujui
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReview("rejected")}
                disabled={reviewLog.isPending}
              >
                {reviewLog.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-1.5 h-4 w-4" />
                )}
                Tolak
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back */}
      <Button asChild variant="outline">
        <Link href="/work-logs">Kembali ke Daftar</Link>
      </Button>
    </div>
  );
}
