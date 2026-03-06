"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import {
  Loader2,
  Calendar,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTasks, useUpdateTaskStatus } from "@/hooks/useTasks";
import { toast } from "sonner";
import type { Task, TaskStatus, Priority } from "@/types/api";

const priorityVariant: Record<Priority, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const statusLabel: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

const statusGroups: { key: TaskStatus; label: string; color: string }[] = [
  { key: "todo", label: "To Do", color: "border-l-gray-400" },
  { key: "in_progress", label: "In Progress", color: "border-l-blue-400" },
  { key: "review", label: "Review", color: "border-l-purple-400" },
  { key: "done", label: "Done", color: "border-l-green-400" },
];

const nextStatus: Record<TaskStatus, TaskStatus | null> = {
  todo: "in_progress",
  in_progress: "review",
  review: "done",
  done: null,
};

function TaskCard({ task }: { task: Task }) {
  const router = useRouter();
  const updateStatus = useUpdateTaskStatus(task.id);

  const handleQuickStatusChange = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = nextStatus[task.status];
    if (!next) return;
    try {
      await updateStatus.mutateAsync(next);
      toast.success(`Status berubah ke ${statusLabel[next]}`);
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
      onClick={() => router.push(`/tasks/${task.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{task.title}</h3>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {task.description}
              </p>
            )}
          </div>
          <Badge className={priorityVariant[task.priority]} variant="outline">
            {task.priority_label}
          </Badge>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className={task.is_overdue ? "text-red-600 font-medium" : ""}>
              {new Date(task.deadline).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            {task.is_overdue && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Terlambat
              </Badge>
            )}
          </div>

          {nextStatus[task.status] && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleQuickStatusChange}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  {statusLabel[nextStatus[task.status]!]}
                  <ArrowRight className="h-3 w-3" />
                </>
              )}
            </Button>
          )}
        </div>

        {task.meeting && (
          <p className="text-xs text-muted-foreground mt-2 truncate">
            Rapat: {task.meeting.title}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function MyTasksPage() {
  const { data, isLoading } = useTasks();

  const tasks = data?.data ?? [];

  // Group tasks by status
  const grouped: Record<TaskStatus, Task[]> = {
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  };

  tasks.forEach((task) => {
    if (grouped[task.status]) {
      grouped[task.status].push(task);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-white/60" />
          Tugas Saya
        </h1>
        <p className="text-white/80 mt-1">
          Daftar tugas yang ditugaskan kepada Anda.
        </p>
      </PageHeader>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-white text-muted-foreground">
          <ClipboardList className="h-10 w-10 mb-3" />
          <p className="text-sm font-medium">Belum ada tugas</p>
          <p className="text-xs mt-1">
            Tugas yang ditugaskan kepada Anda akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {statusGroups.map((group) => {
            const groupTasks = grouped[group.key];
            if (groupTasks.length === 0) return null;

            return (
              <div key={group.key}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {groupTasks.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupTasks.map((task) => (
                    <div key={task.id} className={`border-l-4 ${group.color} rounded-lg`}>
                      <TaskCard task={task} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
