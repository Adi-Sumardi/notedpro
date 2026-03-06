"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRouteId } from "@/hooks/useRouteId";
import PageHeader from "@/components/layout/PageHeader";

import {
  ArrowLeft,
  Loader2,
  Calendar,
  User,
  UserCheck,
  Link2,
  Clock,
  Send,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTask, useUpdateTaskStatus, useAddComment } from "@/hooks/useTasks";
import { toast } from "sonner";
import type { TaskStatus } from "@/types/api";


const statusLabel: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

const statusFlow: TaskStatus[] = ["todo", "in_progress", "review", "done"];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function TaskDetailPage() {
  const id = useRouteId();
  const router = useRouter();
  const taskId = Number(id);

  const { data: task, isLoading } = useTask(taskId);
  const updateStatus = useUpdateTaskStatus(taskId);
  const addComment = useAddComment(taskId);

  const [commentText, setCommentText] = useState("");

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      await updateStatus.mutateAsync(newStatus);
      toast.success(`Status berubah ke ${statusLabel[newStatus]}`);
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    try {
      await addComment.mutateAsync(commentText.trim());
      setCommentText("");
      toast.success("Komentar berhasil ditambahkan");
    } catch {
      toast.error("Gagal menambahkan komentar");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>Tugas tidak ditemukan.</p>
        <Button
          variant="link"
          onClick={() => router.push("/tasks")}
          className="mt-2"
        >
          Kembali ke daftar tugas
        </Button>
      </div>
    );
  }

  const currentStatusIndex = statusFlow.indexOf(task.status);

  return (
    <div className="space-y-6">
      <PageHeader>
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/tasks")}
            className="mt-1 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-white/20 text-white border-white/30" variant="outline">
                {task.status_label}
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30" variant="outline">
                {task.priority_label}
              </Badge>
              {task.is_overdue && (
                <Badge variant="destructive">Terlambat</Badge>
              )}
            </div>
          </div>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {task.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deskripsi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {task.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Status Change Buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ubah Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                {statusFlow.map((status, index) => {
                  const isActive = task.status === status;
                  const isNext = index === currentStatusIndex + 1;
                  return (
                    <div key={status} className="flex items-center gap-2">
                      {index > 0 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Button
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        disabled={isActive || updateStatus.isPending}
                        onClick={() => handleStatusChange(status)}
                        className={isNext ? "ring-2 ring-primary/30" : ""}
                      >
                        {statusLabel[status]}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          {task.activities && task.activities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aktivitas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {task.activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <div className="w-px flex-1 bg-border" />
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm">
                          <span className="font-medium">
                            {activity.user.name}
                          </span>{" "}
                          {activity.action}
                          {activity.old_value && activity.new_value && (
                            <span className="text-muted-foreground">
                              {" "}
                              dari{" "}
                              <span className="font-medium">
                                {activity.old_value}
                              </span>{" "}
                              ke{" "}
                              <span className="font-medium">
                                {activity.new_value}
                              </span>
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {new Date(activity.created_at).toLocaleString(
                            "id-ID"
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Komentar
                {task.comments && task.comments.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {task.comments.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comment List */}
              {task.comments && task.comments.length > 0 ? (
                <div className="space-y-4">
                  {task.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(comment.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {comment.user.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleString(
                              "id-ID"
                            )}
                          </span>
                        </div>
                        <p className="text-sm mt-1 text-muted-foreground">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada komentar.
                </p>
              )}

              <Separator />

              {/* Add Comment Form */}
              <div className="flex gap-3">
                <Textarea
                  placeholder="Tulis komentar..."
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleSubmitComment();
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || addComment.isPending}
                  className="shrink-0"
                >
                  {addComment.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tekan Ctrl+Enter untuk mengirim
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assignee */}
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Penerima Tugas
                  </p>
                  <p className="text-sm font-medium">
                    {task.assigned_to?.name ?? "-"}
                  </p>
                </div>
              </div>

              {/* Assigner */}
              <div className="flex items-center gap-3">
                <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Pemberi Tugas
                  </p>
                  <p className="text-sm font-medium">
                    {task.assigned_by?.name ?? "-"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Deadline */}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p
                    className={`text-sm font-medium ${
                      task.is_overdue ? "text-red-600" : ""
                    }`}
                  >
                    {new Date(task.deadline).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  {task.is_overdue && (
                    <p className="text-xs text-red-500 mt-0.5">Terlambat</p>
                  )}
                </div>
              </div>

              {task.completed_at && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Selesai pada
                      </p>
                      <p className="text-sm font-medium">
                        {new Date(task.completed_at).toLocaleDateString(
                          "id-ID",
                          {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Related Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tautan Terkait</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.meeting && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => router.push(`/meetings/${task.meeting!.id}`)}
                >
                  <Link2 className="h-4 w-4" />
                  <span className="truncate">{task.meeting.title}</span>
                </Button>
              )}
              {task.follow_up_item && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() =>
                    router.push(
                      `/meetings/${task.follow_up_item!.meeting_id}/notes`
                    )
                  }
                >
                  <Link2 className="h-4 w-4" />
                  <span className="truncate">
                    Follow-up: {task.follow_up_item.title}
                  </span>
                </Button>
              )}
              {!task.meeting && !task.follow_up_item && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Tidak ada tautan terkait.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
