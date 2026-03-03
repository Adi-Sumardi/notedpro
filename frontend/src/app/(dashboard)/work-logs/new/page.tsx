"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateWorkLog } from "@/hooks/useWorkLogs";
import { toast } from "sonner";
import api from "@/lib/api";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";

const categoryOptions = [
  { value: "meeting", label: "Rapat/Meeting" },
  { value: "development", label: "Pengembangan" },
  { value: "administrative", label: "Administrasi" },
  { value: "research", label: "Riset/Penelitian" },
  { value: "communication", label: "Komunikasi/Koordinasi" },
  { value: "other", label: "Lainnya" },
] as const;

const workLogSchema = z.object({
  log_date: z.string().min(1, "Tanggal wajib diisi"),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Deskripsi wajib diisi"),
        category: z.enum([
          "meeting",
          "development",
          "administrative",
          "research",
          "communication",
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

export default function NewWorkLogPage() {
  const router = useRouter();
  const createWorkLog = useCreateWorkLog();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WorkLogFormValues>({
    resolver: zodResolver(workLogSchema),
    defaultValues: {
      log_date: new Date().toISOString().split("T")[0],
      notes: "",
      items: [
        {
          description: "",
          category: "development",
          start_time: "08:00",
          end_time: "09:00",
          progress: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  async function onSubmit(values: WorkLogFormValues, submitAfter = false) {
    try {
      const result = await createWorkLog.mutateAsync(values);
      if (submitAfter && result?.data?.id) {
        await api.patch(`/api/v1/work-logs/${result.data.id}/submit`);
        toast.success("Laporan berhasil dibuat dan diajukan!");
      } else {
        toast.success("Laporan harian berhasil disimpan sebagai draft.");
      }
      router.push("/work-logs");
    } catch {
      toast.error("Gagal menyimpan laporan. Silakan coba lagi.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Buat Laporan Harian
        </h1>
        <p className="text-muted-foreground">
          Catat kegiatan kerja Anda hari ini.
        </p>
      </div>

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
              <Input id="log_date" type="date" {...register("log_date")} />
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

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            variant="outline"
            disabled={isSubmitting || createWorkLog.isPending}
          >
            {(isSubmitting || createWorkLog.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Simpan Draft
          </Button>
          <Button
            type="button"
            disabled={isSubmitting || createWorkLog.isPending}
            onClick={handleSubmit((v) => onSubmit(v, true))}
          >
            {(isSubmitting || createWorkLog.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Simpan & Ajukan
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
