"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRouteId } from "@/hooks/useRouteId";

import { ArrowLeft, Loader2, FileText } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TiptapEditor from "@/components/editor/TiptapEditor";
import {
  useMeeting,
  useMeetingNotes,
  useSaveNote,
  useFollowUps,
} from "@/hooks/useMeetings";
import { toast } from "sonner";
import type { Priority, FollowUpStatus } from "@/types/api";

const priorityVariant: Record<Priority, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const statusVariant: Record<FollowUpStatus, string> = {
  open: "bg-yellow-100 text-yellow-700",
  assigned: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

const printStyles = `
@media print {
  header, nav, aside, footer,
  [data-sidebar], [data-radix-popper-content-wrapper],
  .print\\:hidden { display: none !important; }

  body { background: white !important; }

  /* Show only editor content */
  .ProseMirror {
    min-height: unset !important;
    padding: 0 !important;
  }

  /* Hide toolbar and follow-up floating button */
  .border-b.p-2,
  .absolute.z-10 { display: none !important; }
}
`;

export default function MeetingNotesPage() {
  const id = useRouteId();
  const router = useRouter();
  const meetingId = Number(id);

  const { data: meeting, isLoading: meetingLoading } = useMeeting(meetingId);
  const { data: notes, isLoading: notesLoading } = useMeetingNotes(meetingId);
  const { data: followUps, isLoading: followUpsLoading } =
    useFollowUps(meetingId);
  const saveNote = useSaveNote(meetingId);

  const latestNote = notes && notes.length > 0 ? notes[0] : null;

  const handleSave = useCallback(
    async (json: unknown, html: string) => {
      try {
        await saveNote.mutateAsync({
          content: json,
          content_html: html,
          noteId: latestNote?.id,
        });
        toast.success("Notulensi berhasil disimpan");
      } catch {
        toast.error("Gagal menyimpan notulensi");
      }
    },
    [saveNote, latestNote?.id]
  );

  if (meetingLoading || notesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <PageHeader>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => router.push(`/meetings/${meetingId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              <FileText className="inline-block h-6 w-6 mr-2 text-white/60" />
              Notulensi Rapat
            </h1>
            {meeting && (
              <p className="text-white/80 mt-1">{meeting.title}</p>
            )}
          </div>
          {latestNote && (
            <span className="text-xs text-white/60">
              Versi {latestNote.version} &middot; Terakhir disimpan{" "}
              {new Date(latestNote.updated_at).toLocaleString("id-ID")}
            </span>
          )}
        </div>
      </PageHeader>

      {/* Tiptap Editor */}
      <TiptapEditor
        content={latestNote?.content}
        contentHtml={latestNote?.content_html}
        onSave={handleSave}
        meetingId={meetingId}
        noteId={latestNote?.id}
      />

      {/* Follow-Up Items Table */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Follow-Up Items
          {followUps && followUps.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {followUps.length}
            </Badge>
          )}
        </h2>

        {followUpsLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : followUps && followUps.length > 0 ? (
          <div className="border rounded-lg bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Teks yang Disorot</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead className="w-[100px]">Prioritas</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followUps.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <span className="bg-yellow-100 px-1 rounded text-sm">
                        {item.highlighted_text}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          priorityVariant[item.priority]
                        }`}
                      >
                        {item.priority_label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusVariant[item.status]
                        }`}
                      >
                        {item.status_label}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 border rounded-lg bg-white text-muted-foreground">
            <p className="text-sm">Belum ada follow-up item.</p>
            <p className="text-xs mt-1">
              Pilih teks di editor dan klik &quot;Buat Follow-Up&quot; untuk
              membuat item baru.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
