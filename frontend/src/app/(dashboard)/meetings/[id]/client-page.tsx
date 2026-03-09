"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouteId } from "@/hooks/useRouteId";

import { useRouter } from "next/navigation";
import { useMeeting, useUpdateMeetingStatus, useDeleteMeeting } from "@/hooks/useMeetings";
import { useCreateTask } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { useAuthStore } from "@/stores/authStore";
import type { Meeting, FollowUpItem, ExternalContact } from "@/types/api";
import PageHeader from "@/components/layout/PageHeader";
import { toast } from "sonner";

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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  CalendarDays,
  MapPin,
  Users,
  FileText,
  Loader2,
  ArrowRight,
  ClipboardPlus,
  UserPlus,
  X,
  Download,
  Paperclip,
  Trash2,
  Video,
  LinkIcon,
  KeyRound,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";


const meetingStatusLabelMap: Record<string, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
};

const followUpStatusColorMap: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  assigned: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  done: "bg-green-100 text-green-700 hover:bg-green-100",
  cancelled: "bg-gray-100 text-gray-700 hover:bg-gray-100",
};

const followUpStatusLabelMap: Record<string, string> = {
  open: "Open",
  assigned: "Assigned",
  done: "Done",
  cancelled: "Cancelled",
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

function MeetingDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
      </div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function StatusChangeButtons({
  meeting,
  onStatusChange,
  isPending,
}: {
  meeting: Meeting;
  onStatusChange: (status: string) => void;
  isPending: boolean;
}) {
  const transitions: Record<string, { next: string; label: string }> = {
    draft: { next: "in_progress", label: "Mulai Meeting" },
    in_progress: { next: "completed", label: "Selesaikan Meeting" },
  };

  const transition = transitions[meeting.status];

  if (!transition) return null;

  return (
    <Button
      onClick={() => onStatusChange(transition.next)}
      disabled={isPending}
      size="sm"
    >
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {transition.label}
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  );
}

interface AssigneeEntry {
  user_id: number;
  name: string;
  deadline: string;
}

function AssignTaskDialog({
  followUp,
  open,
  onOpenChange,
}: {
  followUp: FollowUpItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: users } = useUsers();
  const createTask = useCreateTask();
  const [assignees, setAssignees] = useState<AssigneeEntry[]>([]);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const availableUsers = (users ?? []).filter(
    (u) => !assignees.some((a) => a.user_id === u.id)
  );

  const handleAddAssignee = (userId: number, userName: string) => {
    if (assignees.some((a) => a.user_id === userId)) return;
    setAssignees((prev) => [
      ...prev,
      { user_id: userId, name: userName, deadline: defaultDeadline },
    ]);
    setUserSearchOpen(false);
  };

  const handleRemoveAssignee = (userId: number) => {
    setAssignees((prev) => prev.filter((a) => a.user_id !== userId));
  };

  const handleDeadlineChange = (userId: number, deadline: string) => {
    setAssignees((prev) =>
      prev.map((a) => (a.user_id === userId ? { ...a, deadline } : a))
    );
  };

  const handleSubmit = async () => {
    if (!followUp || assignees.length === 0) return;

    setIsSubmitting(true);
    try {
      for (const assignee of assignees) {
        await createTask.mutateAsync({
          follow_up_item_id: followUp.id,
          assigned_to: assignee.user_id,
          title: followUp.title,
          description: followUp.description,
          priority: followUp.priority,
          deadline: assignee.deadline,
        });
      }
      toast.success(`Task berhasil ditugaskan ke ${assignees.length} karyawan`);
      setAssignees([]);
      onOpenChange(false);
    } catch {
      toast.error("Gagal menugaskan task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) setAssignees([]);
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tugaskan Follow-Up</DialogTitle>
          <DialogDescription>
            {followUp?.title} — Pilih satu atau beberapa karyawan untuk
            ditugaskan.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label>Karyawan</Label>
            <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" />
                  Tambah Karyawan
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <Command>
                  <CommandInput placeholder="Cari karyawan..." />
                  <CommandList>
                    <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {availableUsers.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.name}
                          onSelect={() =>
                            handleAddAssignee(user.id, user.name)
                          }
                        >
                          <div className="flex flex-col">
                            <span className="text-sm">{user.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {assignees.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Belum ada karyawan yang dipilih.
            </p>
          ) : (
            <div className="space-y-2">
              {assignees.map((assignee) => (
                <div
                  key={assignee.user_id}
                  className="flex items-center gap-2 rounded-lg border p-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <Badge variant="secondary" className="text-xs mb-1.5">
                      {assignee.name}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground shrink-0">
                        Deadline:
                      </Label>
                      <Input
                        type="date"
                        className="h-7 text-xs"
                        value={assignee.deadline}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) =>
                          handleDeadlineChange(
                            assignee.user_id,
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveAssignee(assignee.user_id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || assignees.length === 0}
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Tugaskan ({assignees.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FollowUpTable({
  followUps,
  isAdmin,
}: {
  followUps: FollowUpItem[];
  isAdmin: boolean;
}) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpItem | null>(null);

  const handleAssignClick = (item: FollowUpItem) => {
    setSelectedFollowUp(item);
    setAssignDialogOpen(true);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Teks</TableHead>
            <TableHead>Judul</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ditugaskan</TableHead>
            {isAdmin && <TableHead className="w-[120px]">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {followUps.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={isAdmin ? 6 : 5}
                className="text-center text-muted-foreground"
              >
                Belum ada follow-up item.
              </TableCell>
            </TableRow>
          ) : (
            followUps.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="max-w-[200px] truncate">
                  {item.highlighted_text ?? item.description ?? "-"}
                </TableCell>
                <TableCell className="font-medium">
                  {item.title ?? "-"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={priorityColorMap[item.priority] ?? ""}
                  >
                    {priorityLabelMap[item.priority] ?? item.priority ?? "-"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={followUpStatusColorMap[item.status] ?? ""}
                  >
                    {followUpStatusLabelMap[item.status] ?? item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.tasks && item.tasks.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {item.tasks.map((task) => (
                        <Badge
                          key={task.id}
                          variant="outline"
                          className="text-xs"
                        >
                          {task.assigned_to?.name ?? "?"}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    {item.status === "open" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignClick(item)}
                      >
                        <ClipboardPlus className="mr-1.5 h-3.5 w-3.5" />
                        Assign
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AssignTaskDialog
        followUp={selectedFollowUp}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
      />
    </>
  );
}

function ParticipantsList({
  participants,
}: {
  participants: Meeting["participants"];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={2}
              className="text-center text-muted-foreground"
            >
              Belum ada peserta.
            </TableCell>
          </TableRow>
        ) : (
          participants.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">
                {p.name}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {p.pivot?.role ?? "-"}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function ExternalParticipantsList({
  participants,
}: {
  participants: ExternalContact[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Organisasi</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>No. HP</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">
              {p.name}
              {p.position && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({p.position})
                </span>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {p.organization ?? "-"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {p.email ?? "-"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {p.phone ?? "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function MeetingDetailPage() {
  const id = useRouteId();
  const numericId = Number(id);
  const router = useRouter();

  const { user } = useAuthStore();
  const isAdmin =
    user?.roles?.includes("admin") === true || user?.roles?.includes("super-admin") === true;
  const isSuperAdmin = user?.roles?.includes("super-admin") === true;

  const { data: meeting, isLoading } = useMeeting(numericId);
  const updateStatus = useUpdateMeetingStatus(numericId);
  const deleteMeeting = useDeleteMeeting();

  function handleDelete() {
    deleteMeeting.mutate(numericId, {
      onSuccess: () => {
        toast.success("Meeting berhasil dihapus.");
        router.push("/meetings");
      },
      onError: () => {
        toast.error("Gagal menghapus meeting.");
      },
    });
  }

  function handleStatusChange(newStatus: string) {
    updateStatus.mutate(
      newStatus,
      {
        onSuccess: () => {
          toast.success("Status meeting berhasil diperbarui.");
        },
        onError: () => {
          toast.error("Gagal memperbarui status meeting.");
        },
      }
    );
  }

  if (isLoading) {
    return <MeetingDetailSkeleton />;
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold">Meeting Tidak Ditemukan</h2>
        <p className="mt-1 text-muted-foreground">
          Meeting yang Anda cari tidak ada atau telah dihapus.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/meetings">Kembali ke Daftar Meeting</Link>
        </Button>
      </div>
    );
  }

  const participants = meeting.participants ?? [];
  const followUps: FollowUpItem[] = meeting.latest_note?.follow_up_items ?? [];

  const meetingDate = meeting.meeting_date
    ? format(parseISO(meeting.meeting_date), "EEEE, dd MMMM yyyy - HH:mm", {
        locale: localeId,
      })
    : "-";

  return (
    <div className="space-y-6">
      <PageHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {meeting.title}
              </h1>
              <Badge
                variant="secondary"
                className="bg-white/20 text-white hover:bg-white/20"
              >
                {meetingStatusLabelMap[meeting.status] ?? meeting.status}
              </Badge>
            </div>
            {meeting.description && (
              <p className="text-white/80">{meeting.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StatusChangeButtons
            meeting={meeting}
            onStatusChange={handleStatusChange}
            isPending={updateStatus.isPending}
          />
          {isSuperAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteMeeting.isPending}
                >
                  {deleteMeeting.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Hapus
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Meeting?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Yakin ingin menghapus meeting ini? Semua data terkait (catatan, follow-up, tugas) juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Ya, Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          </div>
        </div>
      </PageHeader>

      {/* Meeting Info Card */}
      <Card>
        <CardContent className="flex flex-wrap gap-6 pt-6">
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span>{meetingDate}</span>
          </div>
          {meeting.location_type === "online" ? (
            <div className="flex items-center gap-2 text-sm">
              <Video className="h-4 w-4 text-muted-foreground" />
              <span>Online</span>
            </div>
          ) : meeting.location ? (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{meeting.location}</span>
            </div>
          ) : null}
          {meeting.location_type === "online" && meeting.meeting_link && (
            <div className="flex items-center gap-2 text-sm">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                {meeting.meeting_link}
              </a>
            </div>
          )}
          {meeting.location_type === "online" && meeting.meeting_passcode && (
            <div className="flex items-center gap-2 text-sm">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <span>Passcode: {meeting.meeting_passcode}</span>
            </div>
          )}
          {meeting.organizer && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Penyelenggara: {meeting.organizer}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {participants.length + (meeting.external_participants?.length ?? 0)} peserta
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Attachment */}
      {meeting.attachment_url && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Lampiran
            </CardTitle>
            <CardDescription className="flex items-center justify-between">
              <span>{meeting.attachment_name ?? "Dokumen PDF"}</span>
              <a
                href={meeting.attachment_url}
                download={meeting.attachment_name ?? "lampiran.pdf"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden bg-muted/30">
              <iframe
                src={meeting.attachment_url}
                className="w-full h-[600px]"
                title="Preview Lampiran PDF"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="catatan" className="w-full">
        <TabsList>
          <TabsTrigger value="catatan">Catatan</TabsTrigger>
          <TabsTrigger value="follow-up">Follow-Up</TabsTrigger>
          <TabsTrigger value="peserta">Peserta</TabsTrigger>
        </TabsList>

        {/* Tab: Catatan */}
        <TabsContent value="catatan">
          <Card>
            <CardHeader>
              <CardTitle>Catatan Meeting</CardTitle>
              <CardDescription>
                Buka editor untuk menulis atau melihat catatan meeting ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {meeting.status === "draft" ? (
                <Button disabled>
                  <FileText className="mr-2 h-4 w-4" />
                  Buka Editor Catatan
                </Button>
              ) : (
                <Button asChild>
                  <Link href={`/meetings/${id}/notes`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Buka Editor Catatan
                  </Link>
                </Button>
              )}
              {meeting.status === "draft" && (
                <p className="text-xs text-muted-foreground mt-2">
                  Klik &quot;Mulai Meeting&quot; terlebih dahulu untuk membuka editor catatan.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Follow-Up */}
        <TabsContent value="follow-up">
          <Card>
            <CardHeader>
              <CardTitle>Follow-Up Items</CardTitle>
              <CardDescription>
                Daftar tindak lanjut dari meeting ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FollowUpTable
                followUps={followUps}
                isAdmin={isAdmin}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Peserta */}
        <TabsContent value="peserta" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Peserta Internal</CardTitle>
              <CardDescription>
                Anggota tim yang terdaftar di aplikasi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ParticipantsList participants={participants} />
            </CardContent>
          </Card>

          {(meeting.external_participants?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Peserta Eksternal</CardTitle>
                <CardDescription>
                  Stakeholder atau pihak luar yang diundang.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExternalParticipantsList
                  participants={meeting.external_participants ?? []}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
