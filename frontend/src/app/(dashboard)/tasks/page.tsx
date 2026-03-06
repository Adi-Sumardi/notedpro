"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ListTodo,
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
import { useTasks, useUpdateTaskStatus } from "@/hooks/useTasks";
import type { Task, TaskStatus, Priority } from "@/types/api";

const priorityVariant: Record<Priority, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const statusOptions: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "Semua Status" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

const priorityOptions: { value: Priority | "all"; label: string }[] = [
  { value: "all", label: "Semua Prioritas" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function StatusDropdown({ task }: { task: Task }) {
  const updateStatus = useUpdateTaskStatus(task.id);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === task.status) return;
    try {
      await updateStatus.mutateAsync(newStatus);
    } catch {
      // Error handled by query client
    }
  };

  return (
    <Select value={task.status} onValueChange={handleStatusChange}>
      <SelectTrigger className="h-7 w-[130px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todo">To Do</SelectItem>
        <SelectItem value="in_progress">In Progress</SelectItem>
        <SelectItem value="review">Review</SelectItem>
        <SelectItem value="done">Done</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default function TasksPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const params: Record<string, string> = {
    page: page.toString(),
  };
  if (search) params.search = search;
  if (statusFilter !== "all") params.status = statusFilter;
  if (priorityFilter !== "all") params.priority = priorityFilter;

  const { data, isLoading } = useTasks(params);

  const tasks = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ListTodo className="h-6 w-6 text-white/60" />
          Semua Tugas
        </h1>
        <p className="text-white/80 mt-1">
          Kelola dan pantau semua tugas dari seluruh rapat.
        </p>
      </PageHeader>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari tugas..."
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

        <Select
          value={priorityFilter}
          onValueChange={(val) => {
            setPriorityFilter(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Prioritas" />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-white text-muted-foreground">
          <ListTodo className="h-10 w-10 mb-3" />
          <p className="text-sm font-medium">Tidak ada tugas ditemukan</p>
          <p className="text-xs mt-1">
            Coba ubah filter atau kata kunci pencarian.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tugas</TableHead>
                <TableHead className="w-[150px]">Penerima</TableHead>
                <TableHead className="w-[120px]">Deadline</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
                <TableHead className="w-[100px]">Prioritas</TableHead>
                <TableHead className="w-[150px]">Rapat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/tasks/${task.id}`)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{task.assigned_to?.name}</span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-sm ${
                        task.is_overdue ? "text-red-600 font-medium" : ""
                      }`}
                    >
                      {new Date(task.deadline).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {task.is_overdue && (
                      <span className="block text-xs text-red-500">
                        Terlambat
                      </span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <StatusDropdown task={task} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={priorityVariant[task.priority]}
                      variant="outline"
                    >
                      {task.priority_label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.meeting && (
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {task.meeting.title}
                      </span>
                    )}
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
            Menampilkan {tasks.length} dari {meta.total} tugas
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
