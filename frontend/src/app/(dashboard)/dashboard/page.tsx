"use client";

import { useDashboardSummary, useMyDashboardSummary } from "@/hooks/useDashboard";
import { useTasks } from "@/hooks/useTasks";
import { useAuthStore } from "@/stores/authStore";
import type { Task, TaskStatus, DashboardSummary } from "@/types/api";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

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
import {
  ClipboardList,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowRight,
  CalendarClock,
  User as UserIcon,
  Circle,
} from "lucide-react";
import { format, isPast, parseISO, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

const statusColorMap: Record<string, string> = {
  todo: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  in_progress: "bg-[#BEDBED]/40 text-[#1C61A2] hover:bg-[#BEDBED]/40",
  review: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  done: "bg-green-100 text-green-700 hover:bg-green-100",
};

const statusLabelMap: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

const priorityColorMap: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const priorityLabelMap: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const columnColors: Record<string, string> = {
  todo: "border-t-gray-400",
  in_progress: "border-t-[#1C61A2]",
  review: "border-t-yellow-500",
  done: "border-t-green-500",
};

const columnDotColors: Record<string, string> = {
  todo: "text-gray-400",
  in_progress: "text-[#1C61A2]",
  review: "text-yellow-500",
  done: "text-green-500",
};

function SummaryCards({
  summary,
  isLoading,
}: {
  summary: DashboardSummary | undefined;
  isLoading: boolean;
}) {
  const totalTasks = summary?.total_tasks ?? 0;
  const inProgress = summary?.by_status?.in_progress ?? 0;
  const completed = summary?.by_status?.done ?? 0;
  const overdue = summary?.overdue ?? 0;
  const completionRate = summary?.completion_rate ?? 0;
  const dueThisWeek = summary?.due_this_week ?? 0;

  const cards = [
    {
      title: "Total Tugas",
      value: totalTasks,
      icon: ClipboardList,
      iconColor: "text-[#1C61A2]",
      bgColor: "bg-[#BEDBED]/40",
    },
    {
      title: "Sedang Dikerjakan",
      value: inProgress,
      icon: Loader2,
      iconColor: "text-[#063E66]",
      bgColor: "bg-[#BEDBED]/30",
    },
    {
      title: "Selesai",
      value: completed,
      subtitle: `${completionRate}%`,
      icon: CheckCircle2,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Terlambat",
      value: overdue,
      icon: AlertTriangle,
      iconColor: overdue > 0 ? "text-red-600" : "text-gray-400",
      bgColor: overdue > 0 ? "bg-red-50" : "bg-gray-50",
      danger: overdue > 0,
    },
    {
      title: "Deadline Minggu Ini",
      value: dueThisWeek,
      icon: CalendarClock,
      iconColor: dueThisWeek > 0 ? "text-orange-600" : "text-gray-400",
      bgColor: dueThisWeek > 0 ? "bg-orange-50" : "bg-gray-50",
    },
    {
      title: "Tingkat Penyelesaian",
      value: `${completionRate}%`,
      icon: TrendingUp,
      iconColor: completionRate >= 50 ? "text-green-600" : "text-orange-600",
      bgColor: completionRate >= 50 ? "bg-green-50" : "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <Card
          key={card.title}
          className={card.danger ? "border-red-300" : ""}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`rounded-md p-1.5 ${card.bgColor}`}>
              <card.icon className={`h-3.5 w-3.5 ${card.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-14" />
            ) : (
              <p className={`text-xl font-bold ${card.danger ? "text-red-600" : ""}`}>
                {card.value}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const isOverdue =
    task.deadline && isPast(parseISO(task.deadline)) && task.status !== "done";

  return (
    <Link href={`/tasks/${task.id}`}>
      <div className="rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug line-clamp-2">
            {task.title}
          </p>
          <Badge
            variant="secondary"
            className={`shrink-0 text-[10px] px-1.5 py-0 ${priorityColorMap[task.priority] ?? ""}`}
          >
            {priorityLabelMap[task.priority] ?? task.priority}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <UserIcon className="h-3 w-3" />
          <span className="truncate">{task.assigned_to?.name ?? "-"}</span>
        </div>

        {task.deadline && (
          <div
            className={`flex items-center gap-1.5 text-xs ${
              isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>
              {format(parseISO(task.deadline), "dd MMM yyyy", { locale: localeId })}
              {isOverdue && " (terlambat)"}
            </span>
          </div>
        )}

        {task.follow_up_item?.meeting && (
          <p className="text-[11px] text-muted-foreground truncate">
            {task.follow_up_item.meeting.title}
          </p>
        )}
      </div>
    </Link>
  );
}

function KanbanBoard({
  tasks,
  isLoading,
}: {
  tasks: Task[];
  isLoading: boolean;
}) {
  const columns: { status: TaskStatus; label: string }[] = [
    { status: "todo", label: "To Do" },
    { status: "in_progress", label: "In Progress" },
    { status: "review", label: "Review" },
    { status: "done", label: "Done" },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => (
          <Card key={col.status}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.status);
        return (
          <Card
            key={col.status}
            className={`border-t-4 ${columnColors[col.status]}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Circle
                    className={`h-3 w-3 fill-current ${columnDotColors[col.status]}`}
                  />
                  <CardTitle className="text-sm font-semibold">
                    {col.label}
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {columnTasks.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
              {columnTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Tidak ada tugas
                </p>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function OverdueTasksList({ tasks }: { tasks: Task[] }) {
  const overdueTasks = tasks
    .filter(
      (t) =>
        t.deadline &&
        isPast(parseISO(t.deadline)) &&
        t.status !== "done"
    )
    .sort(
      (a, b) =>
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );

  if (overdueTasks.length === 0) return null;

  return (
    <Card className="border-red-200 bg-red-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-base text-red-800">
              Tugas Terlambat ({overdueTasks.length})
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tasks" className="text-red-700">
              Lihat Semua
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <CardDescription className="text-red-600/80">
          Tugas berikut sudah melewati deadline dan memerlukan perhatian segera.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {overdueTasks.slice(0, 5).map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`}>
              <div className="flex items-center justify-between rounded-lg border border-red-200 bg-white px-3 py-2.5 hover:shadow-sm transition-shadow">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {task.assigned_to?.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 ${statusColorMap[task.status]}`}
                    >
                      {statusLabelMap[task.status]}
                    </Badge>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-xs font-medium text-red-600">
                    {format(parseISO(task.deadline), "dd MMM yyyy", {
                      locale: localeId,
                    })}
                  </p>
                  <p className="text-[11px] text-red-500">
                    {formatDistanceToNow(parseISO(task.deadline), {
                      addSuffix: true,
                      locale: localeId,
                    })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LiveIndicator() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      Live
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const isAdmin =
    user?.roles?.includes("admin") || user?.roles?.includes("super-admin");

  const { data: adminSummary, isLoading: adminLoading } = useDashboardSummary();
  const { data: mySummary, isLoading: myLoading } = useMyDashboardSummary();

  const { data: tasksData, isLoading: tasksLoading } = useTasks({
    page: "1",
    per_page: "100",
  });

  const summary = isAdmin ? adminSummary : mySummary;
  const summaryLoading = isAdmin ? adminLoading : myLoading;

  const allTasks: Task[] = tasksData?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Dashboard
            </h1>
            <p className="text-white/80">
              {isAdmin
                ? "Ringkasan keseluruhan proyek dan tugas tim."
                : "Ringkasan tugas dan aktivitas Anda."}
            </p>
          </div>
          <LiveIndicator />
        </div>
      </PageHeader>

      <SummaryCards summary={summary} isLoading={summaryLoading} />

      <OverdueTasksList tasks={allTasks} />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#063E66]">
            Board Tugas
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/tasks">
              Lihat Semua Tugas
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <KanbanBoard tasks={allTasks} isLoading={tasksLoading} />
      </div>
    </div>
  );
}