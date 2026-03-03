"use client";

import { useState } from "react";
import Link from "next/link";
import { useMeetings } from "@/hooks/useMeetings";
import { useAuthStore } from "@/stores/authStore";
import type { Meeting } from "@/types/api";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  MapPin,
  Users,
  ListChecks,
  Plus,
  Search,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";

const statusColorMap: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  in_progress: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  completed: "bg-green-100 text-green-700 hover:bg-green-100",
};

const statusLabelMap: Record<string, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
};

function MeetingCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="mt-2 h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const meetingDate = meeting.meeting_date
    ? format(parseISO(meeting.meeting_date), "EEEE, dd MMMM yyyy - HH:mm", {
        locale: localeId,
      })
    : "-";

  const participantsCount = meeting.participants?.length ?? 0;
  const followUpsCount = meeting.follow_ups_count ?? 0;

  return (
    <Link href={`/meetings/${meeting.id}`}>
      <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight line-clamp-2">
              {meeting.title}
            </CardTitle>
            <Badge
              variant="secondary"
              className={statusColorMap[meeting.status] ?? ""}
            >
              {statusLabelMap[meeting.status] ?? meeting.status}
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-1.5 mt-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {meetingDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {meeting.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{meeting.location}</span>
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>{participantsCount} peserta</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" />
              <span>{followUpsCount} follow-up</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function MeetingsPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");

  const canCreate =
    user?.roles?.includes("admin") ||
    user?.roles?.includes("super-admin") ||
    user?.roles?.includes("noter");

  const { data, isLoading } = useMeetings({ search });

  const meetings: Meeting[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground">
            Kelola rapat dan catatan meeting tim.
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/meetings/new">
              <Plus className="mr-2 h-4 w-4" />
              Buat Meeting
            </Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari meeting..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Meeting Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <MeetingCardSkeleton key={i} />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">Belum ada meeting</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? "Tidak ada meeting yang cocok dengan pencarian."
                : "Buat meeting pertama Anda untuk mulai mencatat."}
            </p>
            {canCreate && !search && (
              <Button asChild className="mt-4">
                <Link href="/meetings/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Meeting
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}
