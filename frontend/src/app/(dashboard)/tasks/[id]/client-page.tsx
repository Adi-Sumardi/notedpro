"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRouteId } from "@/hooks/useRouteId";
import PageHeader from "@/components/layout/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  Paperclip,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  Download,
  Eye,
  Upload,
  X,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useTask,
  useUpdateTaskStatus,
  useAddComment,
  useUploadTaskAttachments,
  useDeleteTaskAttachment,
} from "@/hooks/useTasks";
import { toast } from "sonner";
import type { TaskStatus, TaskAttachment } from "@/types/api";

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

function isPreviewable(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  return ["pdf", "jpg", "jpeg", "png"].includes(ext ?? "");
}

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

function AttachmentRow({
  att,
  onPreview,
  onDelete,
}: {
  att: TaskAttachment;
  onPreview: (att: TaskAttachment) => void;
  onDelete?: (id: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
      {getFileIcon(att.original_name)}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{att.original_name}</p>
        {att.file_size && (
          <p className="text-xs text-muted-foreground">
            {(att.file_size / 1024 / 1024).toFixed(2)} MB
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {isPreviewable(att.original_name) && att.file_url && (
          <button
            onClick={() => onPreview(att)}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
        )}
        {att.file_url && (
          <a
            href={att.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Unduh
          </a>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(att.id)}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function TaskDetailPage() {
  const id = useRouteId();
  const router = useRouter();
  const taskId = Number(id);

  const { data: task, isLoading } = useTask(taskId);
  const updateStatus = useUpdateTaskStatus(taskId);
  const addComment = useAddComment(taskId);
  const uploadAttachments = useUploadTaskAttachments(taskId);
  const deleteAttachment = useDeleteTaskAttachment(taskId);

  const [commentText, setCommentText] = useState("");
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const commentFileRef = useRef<HTMLInputElement>(null);
  const taskFileRef = useRef<HTMLInputElement>(null);

  const [previewAttachment, setPreviewAttachment] = useState<{
    url: string;
    name: string;
    type: "pdf" | "image";
  } | null>(null);

  const handlePreview = (att: TaskAttachment) => {
    if (!att.file_url) return;
    const ext = att.original_name.split(".").pop()?.toLowerCase();
    setPreviewAttachment({
      url: att.file_url,
      name: att.original_name,
      type: ext === "pdf" ? "pdf" : "image",
    });
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      await updateStatus.mutateAsync(newStatus);
      toast.success(`Status berubah ke ${statusLabel[newStatus]}`);
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() && commentFiles.length === 0) return;
    try {
      await addComment.mutateAsync({
        content: commentText.trim() || "(lampiran)",
        files: commentFiles.length > 0 ? commentFiles : undefined,
      });
      setCommentText("");
      setCommentFiles([]);
      toast.success("Komentar berhasil ditambahkan");
    } catch {
      toast.error("Gagal menambahkan komentar");
    }
  };

  const handleUploadTaskFiles = async (files: FileList) => {
    try {
      await uploadAttachments.mutateAsync(Array.from(files));
      toast.success(`${files.length} file berhasil diupload`);
    } catch {
      toast.error("Gagal mengupload file");
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await deleteAttachment.mutateAsync(attachmentId);
      toast.success("Lampiran berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus lampiran");
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
  const taskAttachments = task.attachments ?? [];

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

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lampiran</CardTitle>
              <CardDescription>
                {taskAttachments.length > 0
                  ? `${taskAttachments.length} lampiran`
                  : "Belum ada lampiran"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {taskAttachments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <FileText className="h-8 w-8 mb-2" />
                  <p className="text-sm">Belum ada file yang dilampirkan.</p>
                </div>
              ) : (
                taskAttachments.map((att) => (
                  <AttachmentRow
                    key={att.id}
                    att={att}
                    onPreview={handlePreview}
                    onDelete={handleDeleteAttachment}
                  />
                ))
              )}

              {/* Upload button */}
              <div className="pt-2">
                <input
                  ref={taskFileRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleUploadTaskFiles(e.target.files);
                      e.target.value = "";
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => taskFileRef.current?.click()}
                  disabled={uploadAttachments.isPending}
                >
                  {uploadAttachments.isPending ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-1.5 h-4 w-4" />
                  )}
                  Upload File
                </Button>
              </div>
            </CardContent>
          </Card>

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
                        <p className="text-sm mt-1 text-muted-foreground whitespace-pre-wrap">
                          {comment.content}
                        </p>
                        {/* Comment attachments */}
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {comment.attachments.map((att) => (
                              <AttachmentRow
                                key={att.id}
                                att={att}
                                onPreview={handlePreview}
                              />
                            ))}
                          </div>
                        )}
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
              <div className="space-y-3">
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
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button
                      size="icon"
                      onClick={handleSubmitComment}
                      disabled={
                        (!commentText.trim() && commentFiles.length === 0) ||
                        addComment.isPending
                      }
                    >
                      {addComment.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                    <input
                      ref={commentFileRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          setCommentFiles((prev) => [
                            ...prev,
                            ...Array.from(e.target.files!),
                          ]);
                          e.target.value = "";
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => commentFileRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Pending files for comment */}
                {commentFiles.length > 0 && (
                  <div className="space-y-1.5">
                    {commentFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm rounded-md border border-dashed border-green-300 bg-green-50 px-3 py-1.5"
                      >
                        {getFileIcon(f.name)}
                        <span className="truncate flex-1">{f.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {(f.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <button
                          onClick={() =>
                            setCommentFiles((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Tekan Ctrl+Enter untuk mengirim
                </p>
              </div>
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

      {/* Preview Modal */}
      <Dialog
        open={!!previewAttachment}
        onOpenChange={(open) => !open && setPreviewAttachment(null)}
      >
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">
              {previewAttachment?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-auto">
            {previewAttachment?.type === "pdf" ? (
              <iframe
                src={previewAttachment.url}
                className="w-full h-[70vh] rounded border"
                title={previewAttachment.name}
              />
            ) : previewAttachment?.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewAttachment.url}
                alt={previewAttachment.name}
                className="max-w-full max-h-[70vh] mx-auto rounded object-contain"
              />
            ) : null}
          </div>
          <div className="flex justify-end pt-2">
            <a
              href={previewAttachment?.url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Unduh
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
