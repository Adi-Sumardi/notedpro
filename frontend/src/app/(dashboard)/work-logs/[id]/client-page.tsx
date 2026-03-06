"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
} from "lucide-react";
import type { WorkLogStatus } from "@/types/api";

const statusColorMap: Record<WorkLogStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const categoryColorMap: Record<string, string> = {
  meeting: "bg-purple-100 text-purple-700",
  development: "bg-blue-100 text-blue-700",
  administrative: "bg-gray-100 text-gray-700",
  research: "bg-yellow-100 text-yellow-700",
  communication: "bg-green-100 text-green-700",
  other: "bg-gray-100 text-gray-600",
};

export default function WorkLogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

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

  const isOwner = user?.id === log.user?.id;
  const canEdit =
    isOwner && (log.status === "draft" || log.status === "rejected");
  const canSubmit = canEdit;
  const canReview = isReviewer && log.status === "submitted";
  const canDelete = isOwner && log.status === "draft";

  async function handleSubmit() {
    try {
      await submitLog.mutateAsync();
      toast.success("Laporan berhasil diajukan!");
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
    if (!confirm("Yakin ingin menghapus laporan ini?")) return;
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Laporan Harian
            </h1>
            <Badge
              variant="secondary"
              className={statusColorMap[log.status] ?? ""}
            >
              {log.status_label}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
            <Button asChild variant="outline" size="sm">
              <Link href={`/work-logs/${id}/edit`}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          {canSubmit && (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitLog.isPending}
            >
              {submitLog.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-4 w-4" />
              )}
              Ajukan
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteLog.isPending}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Hapus
            </Button>
          )}
        </div>
      </div>

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
