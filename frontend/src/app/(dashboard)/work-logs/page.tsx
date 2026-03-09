"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ClipboardPenLine,
  Plus,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWorkLogs } from "@/hooks/useWorkLogs";
import { useAuthStore } from "@/stores/authStore";
import type { WorkLogStatus } from "@/types/api";

const statusColorMap: Record<WorkLogStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const statusOptions: { value: string; label: string }[] = [
  { value: "all", label: "Semua Status" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Dilaporkan" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

export default function WorkLogsPage() {
  const { user, hasRole } = useAuthStore();
  const isReviewer =
    hasRole("admin") || hasRole("super-admin") || hasRole("manager");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const params: Record<string, string> = { page: page.toString() };
  if (search) params.search = search;
  if (statusFilter !== "all") params.status = statusFilter;

  const { data, isLoading } = useWorkLogs(params);
  const logs = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ClipboardPenLine className="h-6 w-6 text-white/60" />
              Laporan Harian
            </h1>
            <p className="text-white/80 mt-1">
              {isReviewer
                ? "Pantau dan review laporan harian tim."
                : "Catat dan kelola pekerjaan harian Anda."}
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/work-logs/new">
              <Plus className="mr-2 h-4 w-4" />
              Buat Laporan
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari laporan..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-white text-muted-foreground">
          <ClipboardPenLine className="h-10 w-10 mb-3" />
          <p className="text-sm font-medium">Belum ada laporan harian</p>
          <p className="text-xs mt-1">
            Klik &quot;Buat Laporan&quot; untuk mulai mencatat.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                {isReviewer && <TableHead>Staff</TableHead>}
                <TableHead className="w-[120px]">Kegiatan</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {new Date(log.log_date).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </TableCell>
                  {isReviewer && (
                    <TableCell>{log.user?.name ?? "-"}</TableCell>
                  )}
                  <TableCell>{log.items_count ?? 0} item</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusColorMap[log.status] ?? ""}
                    >
                      {log.status_label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/work-logs/${log.id}`}>Detail</Link>
                      </Button>
                      {Number(user?.id) === Number(log.user?.id) &&
                        (log.status === "draft" || log.status === "submitted" || log.status === "rejected") && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/work-logs/${log.id}/edit`}>
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {logs.length} dari {meta.total} laporan
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </Button>
            <span className="text-sm text-muted-foreground">
              Halaman {meta.current_page} dari {meta.last_page}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              disabled={page >= meta.last_page}
            >
              Selanjutnya
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
