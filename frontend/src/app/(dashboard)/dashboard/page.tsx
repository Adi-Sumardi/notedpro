"use client";

import { useDashboardSummary, useMyDashboardSummary } from "@/hooks/useDashboard";
import { useTasks } from "@/hooks/useTasks";
import { useAuthStore } from "@/stores/authStore";
import type { Task } from "@/types/api";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardList,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
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
  low: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  medium: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  high: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  urgent: "bg-red-100 text-red-700 hover:bg-red-100",
};

const priorityLabelMap: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

function SummaryCards({
  totalTasks,
  inProgress,
  completed,
  overdue,
  isLoading,
}: {
  totalTasks: number;
  inProgress: number;
  completed: number;
  overdue: number;
  isLoading: boolean;
}) {
  const cards = [
    {
      title: "Total Tasks",
      value: totalTasks,
      icon: ClipboardList,
      iconColor: "text-[#1C61A2]",
      bgColor: "bg-[#BEDBED]/40",
    },
    {
      title: "In Progress",
      value: inProgress,
      icon: Loader2,
      iconColor: "text-[#063E66]",
      bgColor: "bg-[#BEDBED]/30",
    },
    {
      title: "Completed",
      value: completed,
      icon: CheckCircle2,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Overdue",
      value: overdue,
      icon: AlertTriangle,
      iconColor: overdue > 0 ? "text-red-600" : "text-gray-600",
      bgColor: overdue > 0 ? "bg-red-50" : "bg-gray-50",
      danger: overdue > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className={card.danger ? "border-red-300" : ""}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`rounded-md p-2 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p
                className={`text-2xl font-bold ${
                  card.danger ? "text-red-600" : ""
                }`}
              >
                {card.value}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RecentTasksTable({
  tasks,
  isLoading,
}: {
  tasks: Task[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>Tugas terbaru yang perlu diperhatikan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Tasks</CardTitle>
        <CardDescription>Tugas terbaru yang perlu diperhatikan</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  Belum ada tugas.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => {
                const isOverdue =
                  task.deadline &&
                  isPast(parseISO(task.deadline)) &&
                  task.status !== "done";

                return (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                      {task.title}
                    </TableCell>
                    <TableCell>
                      {task.assigned_to?.name ?? "-"}
                    </TableCell>
                    <TableCell
                      className={isOverdue ? "text-red-600 font-medium" : ""}
                    >
                      {task.deadline
                        ? format(parseISO(task.deadline), "dd MMM yyyy", {
                            locale: localeId,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          statusColorMap[task.status] ?? ""
                        }
                      >
                        {statusLabelMap[task.status] ?? task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          priorityColorMap[task.priority] ?? ""
                        }
                      >
                        {priorityLabelMap[task.priority] ?? task.priority}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const isAdmin =
    user?.roles?.includes("admin") || user?.roles?.includes("super-admin");

  const {
    data: adminSummary,
    isLoading: adminLoading,
  } = useDashboardSummary();

  const {
    data: mySummary,
    isLoading: myLoading,
  } = useMyDashboardSummary();

  const { data: tasksData, isLoading: tasksLoading } = useTasks({
    page: "1",
    per_page: "10",
  });

  const summary = isAdmin ? adminSummary : mySummary;
  const summaryLoading = isAdmin ? adminLoading : myLoading;

  const totalTasks = summary?.total_tasks ?? 0;
  const inProgress = summary?.by_status?.in_progress ?? 0;
  const completed = summary?.by_status?.done ?? 0;
  const overdue = summary?.overdue ?? 0;

  const recentTasks: Task[] = tasksData?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#063E66]">Dashboard</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Ringkasan keseluruhan proyek dan tugas tim."
            : "Ringkasan tugas dan aktivitas Anda."}
        </p>
      </div>

      <SummaryCards
        totalTasks={totalTasks}
        inProgress={inProgress}
        completed={completed}
        overdue={overdue}
        isLoading={summaryLoading}
      />

      <RecentTasksTable tasks={recentTasks} isLoading={tasksLoading} />
    </div>
  );
}
