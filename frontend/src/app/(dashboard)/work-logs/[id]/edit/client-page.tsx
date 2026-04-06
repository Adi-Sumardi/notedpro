"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import { useRouteId } from "@/hooks/useRouteId";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWorkLog, useUpdateWorkLog } from "@/hooks/useWorkLogs";
import { toast } from "sonner";
import api from "@/lib/api";
import type { WorkLogAttachment } from "@/types/api";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Trash2,
  Upload,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  X,
  Link2,
  ExternalLink,
} from "lucide-react";

const categoryOptions = [
  { value: "meeting", label: "Rapat/Meeting" },
  { value: "development", label: "Pengembangan" },
  { value: "administrative", label: "Administrasi" },
  { value: "research", label: "Riset/Penelitian" },
  { value: "communication", label: "Komunikasi/Koordinasi" },
  { value: "monitoring", label: "Monitoring/Evaluasi" },
  { value: "other", label: "Lainnya" },
] as const;

const ACCEPTED_FILE_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.pptx,.jpg,.jpeg,.png";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

interface LinkItem {
  url: string;
  label: string;
}

const workLogSchema = z.object({
  log_date: z.string().min(1, "Tanggal wajib diisi"),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.number().optional(),
        description: z.string().min(1, "Deskripsi wajib diisi"),
        category: z.enum([
          "meeting",
          "development",
          "administrative",
          "research",
          "communication",
          "monitoring",
          "other",
        ]),
        start_time: z.string().min(1, "Waktu mulai wajib diisi"),
        end_time: z.string().min(1, "Waktu selesai wajib diisi"),
        progress: z.number().min(0).max(100),
      })
    )
    .min(1, "Minimal satu kegiatan harus diisi"),
});

type WorkLogFormValues = z.infer<typeof workLogSchema>;

export default function EditWorkLogPage() {
  const routeId = useRouteId();
  const router = useRouter();
  const id = Number(routeId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: log, isLoading } = useWorkLog(id);
  const updateWorkLog = useUpdateWorkLog(id);

  const [existingAttachments, setExistingAttachments] = useState<WorkLogAttachment[]>([]);
  const [existingLinks, setExistingLinks] = useState<WorkLogAttachment[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newLinks, setNewLinks] = useState<LinkItem[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkLabel, setNewLinkLabel] = useState("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkLogFormValues>({
    resolver: zodResolver(workLogSchema),
    defaultValues: {
      log_date: "",
      notes: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    if (log) {
      if (log.status !== "draft" && log.status !== "rejected") {
        router.replace(`/work-logs/${id}`);
        return;
      }
      reset({
        log_date: log.log_date,
        notes: log.notes ?? "",
        items: (log.items ?? []).map((item) => ({
          id: item.id,
          description: item.description,
          category: item.category,
          start_time: item.start_time,
          end_time: item.end_time,
          progress: item.progress,
        })),
      });
      const attachments = log.attachments ?? [];
      setExistingAttachments(attachments.filter((a) => a.type === "file"));
      setExistingLinks(attachments.filter((a) => a.type === "link"));
    }
  }, [log, reset, id, router]);

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const valid = selected.filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name} melebihi batas 10MB`);
        return false;
      }
      return true;
    });
    setNewFiles((prev) => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeNewFile(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function removeExistingAttachment(attId: number) {
    setExistingAttachments((prev) => prev.filter((a) => a.id !== attId));
  }

  function removeExistingLink(attId: number) {
    setExistingLinks((prev) => prev.filter((a) => a.id !== attId));
  }

  function addLink() {
    if (!newLinkUrl.trim()) {
      toast.error("URL wajib diisi");
      return;
    }
    try {
      new URL(newLinkUrl);
    } catch {
      toast.error("Format URL tidak valid");
      return;
    }
    setNewLinks((prev) => [
      ...prev,
      { url: newLinkUrl.trim(), label: newLinkLabel.trim() || newLinkUrl.trim() },
    ]);
    setNewLinkUrl("");
    setNewLinkLabel("");
  }

  function removeNewLink(index: number) {
    setNewLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function buildFormData(values: WorkLogFormValues): FormData {
    const fd = new FormData();
    fd.append("log_date", values.log_date);
    if (values.notes) fd.append("notes", values.notes);

    values.items.forEach((item, i) => {
      if (item.id) fd.append(`items[${i}][id]`, String(item.id));
      fd.append(`items[${i}][description]`, item.description);
      fd.append(`items[${i}][category]`, item.category);
      fd.append(`items[${i}][start_time]`, item.start_time);
      fd.append(`items[${i}][end_time]`, item.end_time);
      fd.append(`items[${i}][progress]`, String(item.progress));
    });

    const keepIds = [
      ...existingAttachments.map((a) => a.id),
      ...existingLinks.map((a) => a.id),
    ];
    keepIds.forEach((kid) => {
      fd.append("existing_attachment_ids[]", String(kid));
    });

    newFiles.forEach((file) => {
      fd.append("attachments[]", file);
    });

    newLinks.forEach((link, i) => {
      fd.append(`links[${i}][url]`, link.url);
      if (link.label) fd.append(`links[${i}][label]`, link.label);
    });

    return fd;
  }

  async function onSubmit(values: WorkLogFormValues, submitAfter = false) {
    try {
      const hasAttachments =
        newFiles.length > 0 ||
        newLinks.length > 0 ||
        existingAttachments.length !== (log?.attachments?.filter((a) => a.type === "file").length ?? 0) ||
        existingLinks.length !== (log?.attachments?.filter((a) => a.type === "link").length ?? 0);

      const payload = hasAttachments ? buildFormData(values) : values;
      await updateWorkLog.mutateAsync(payload);
      if (submitAfter) {
        await api.patch(`/api/v1/work-logs/${id}/submit`);
        toast.success("Laporan berhasil diperbarui dan dilaporkan!");
      } else {
        toast.success("Laporan berhasil diperbarui.");
      }
      router.push("/work-logs");
    } catch {
      toast.error("Gagal memperbarui laporan.");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit Laporan Harian
        </h1>
        <p className="text-white/80">
          Perbarui kegiatan kerja Anda.
        </p>
      </PageHeader>

      <form
        onSubmit={handleSubmit((v) => onSubmit(v, false))}
        className="space-y-6"
      >
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi</CardTitle>
            <CardDescription>Tanggal dan catatan umum.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="log_date">
                Tanggal <span className="text-red-500">*</span>
              </Label>
              <Input id="log_date" type="date" className="[color-scheme:light]" {...register("log_date")} />
              {errors.log_date && (
                <p className="text-sm text-red-500">
                  {errors.log_date.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Catatan tambahan..."
                rows={2}
                {...register("notes")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Items Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Kegiatan</CardTitle>
                <CardDescription>
                  Daftar pekerjaan yang dilakukan.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    description: "",
                    category: "development",
                    start_time: "08:00",
                    end_time: "09:00",
                    progress: 0,
                  })
                }
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Tambah
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {errors.items?.root && (
              <p className="text-sm text-red-500">
                {errors.items.root.message}
              </p>
            )}

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="relative rounded-lg border p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Kegiatan #{index + 1}
                  </span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <input
                  type="hidden"
                  {...register(`items.${index}.id`)}
                />

                <div className="space-y-2">
                  <Label>
                    Deskripsi <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    placeholder="Apa yang dikerjakan..."
                    rows={2}
                    {...register(`items.${index}.description`)}
                  />
                  {errors.items?.[index]?.description && (
                    <p className="text-sm text-red-500">
                      {errors.items[index].description?.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select
                      value={watch(`items.${index}.category`)}
                      onValueChange={(val) =>
                        setValue(
                          `items.${index}.category` as const,
                          val as WorkLogFormValues["items"][number]["category"]
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Mulai</Label>
                    <Input
                      type="time"
                      {...register(`items.${index}.start_time`)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Selesai</Label>
                    <Input
                      type="time"
                      {...register(`items.${index}.end_time`)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Progress (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      {...register(`items.${index}.progress`, { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Attachments Card */}
        <Card>
          <CardHeader>
            <CardTitle>Lampiran</CardTitle>
            <CardDescription>
              Upload file pendukung atau tambahkan link dokumen online.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div className="space-y-3">
              <Label>File</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                multiple
                className="hidden"
                onChange={handleFilesSelected}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Pilih File
              </Button>
              <p className="text-xs text-muted-foreground">
                Format: PDF, Word, Excel, PowerPoint, JPEG, PNG. Maks 10MB per file.
              </p>

              {/* Existing files */}
              {existingAttachments.length > 0 && (
                <div className="space-y-2">
                  {existingAttachments.map((att) => (
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
                      <button
                        type="button"
                        onClick={() => removeExistingAttachment(att.id)}
                        className="rounded-full p-1 hover:bg-muted shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New files */}
              {newFiles.length > 0 && (
                <div className="space-y-2">
                  {newFiles.map((file, i) => (
                    <div
                      key={`new-${file.name}-${i}`}
                      className="flex items-center gap-3 rounded-lg border border-dashed border-green-300 bg-green-50 px-3 py-2"
                    >
                      {getFileIcon(file.name)}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB (baru)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNewFile(i)}
                        className="rounded-full p-1 hover:bg-muted shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Link Attachments */}
            <div className="space-y-3">
              <Label>Link Dokumen</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="https://docs.google.com/..."
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Label (opsional)"
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  className="sm:w-48"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addLink}
                  className="shrink-0 w-full sm:w-auto gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Tambah
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Spreadsheet, Google Docs, Canva, atau link lainnya.
              </p>

              {/* Existing links */}
              {existingLinks.length > 0 && (
                <div className="space-y-2">
                  {existingLinks.map((att) => (
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
                        className="rounded-full p-1 hover:bg-muted shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                      <button
                        type="button"
                        onClick={() => removeExistingLink(att.id)}
                        className="rounded-full p-1 hover:bg-muted shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New links */}
              {newLinks.length > 0 && (
                <div className="space-y-2">
                  {newLinks.map((link, i) => (
                    <div
                      key={`new-${link.url}-${i}`}
                      className="flex items-center gap-3 rounded-lg border border-dashed border-green-300 bg-green-50 px-3 py-2"
                    >
                      <Link2 className="h-5 w-5 text-blue-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {link.label} (baru)
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {link.url}
                        </p>
                      </div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full p-1 hover:bg-muted shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                      <button
                        type="button"
                        onClick={() => removeNewLink(i)}
                        className="rounded-full p-1 hover:bg-muted shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            variant="outline"
            disabled={isSubmitting || updateWorkLog.isPending}
          >
            {(isSubmitting || updateWorkLog.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Simpan Draft
          </Button>
          <Button
            type="button"
            disabled={isSubmitting || updateWorkLog.isPending}
            onClick={handleSubmit((v) => onSubmit(v, true))}
          >
            {(isSubmitting || updateWorkLog.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Simpan & Laporkan
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}
