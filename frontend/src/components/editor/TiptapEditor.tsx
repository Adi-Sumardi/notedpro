"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo,
  Redo,
  Save,
  Loader2,
  MessageSquarePlus,
  X,
  UserPlus,
  Upload,
  Download,
  Printer,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Code,
  Minus,
  Highlighter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { tiptapToMarkdown, markdownToHtml } from "@/lib/markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useCreateFollowUp } from "@/hooks/useMeetings";
import { useUsers } from "@/hooks/useUsers";
import { toast } from "sonner";
import type { Priority } from "@/types/api";

interface Assignee {
  user_id: number;
  name: string;
  deadline: string;
}

interface TiptapEditorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  /** Fallback HTML content — used when JSON content is null (e.g. imported from Notion) */
  contentHtml?: string | null;
  onSave: (json: unknown, html: string) => Promise<void> | void;
  meetingId: number;
  noteId: number | undefined;
}

// ─── Toolbar helpers ──────────────────────────────────────────────────────────

function Divider() {
  return <div className="w-px h-5 bg-border mx-0.5 shrink-0" />;
}

function ToolBtn({
  active,
  title,
  onClick,
  disabled,
  children,
}: {
  active?: boolean;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={onClick}
      disabled={disabled}
      title={title}
      type="button"
    >
      {children}
    </Button>
  );
}

// ─── TiptapEditor ─────────────────────────────────────────────────────────────

export default function TiptapEditor({
  content,
  contentHtml,
  onSave,
  meetingId,
  noteId,
}: TiptapEditorProps) {
  const [showFollowUpButton, setShowFollowUpButton] = useState(false);
  const [followUpPosition, setFollowUpPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({
    title: "",
    priority: "medium" as Priority,
    description: "",
  });
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "saved" | "saving" | "unsaved"
  >("saved");
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const onSaveRef = useRef(onSave);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

  const createFollowUp = useCreateFollowUp(meetingId);
  const { data: users } = useUsers();

  const defaultDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: "Mulai menulis notulensi rapat..." }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
    ],
    content: content || undefined,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[500px] focus:outline-none px-6 py-4",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      setAutoSaveStatus("unsaved");
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        setAutoSaveStatus("saving");
        onSaveRef.current(currentEditor.getJSON(), currentEditor.getHTML());
        setAutoSaveStatus("saved");
      }, 3000);
    },
  });

  // Load HTML fallback when JSON content is null (e.g. imported from Notion)
  useEffect(() => {
    if (!editor || content || !contentHtml) return;
    editor.commands.setContent(contentHtml);
  }, [editor, content, contentHtml]);

  // Floating follow-up button on text selection
  useEffect(() => {
    if (!editor) return;
    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, " ");
      if (text.trim().length > 0) {
        setSelectedText(text.trim());
        const coords = editor.view.coordsAtPos(from);
        const containerRect = editorContainerRef.current?.getBoundingClientRect();
        if (containerRect) {
          setFollowUpPosition({
            top: coords.top - containerRect.top - 40,
            left: coords.left - containerRect.left,
          });
        }
        setShowFollowUpButton(true);
      } else {
        setShowFollowUpButton(false);
        setSelectedText("");
      }
    };
    editor.on("selectionUpdate", handleSelectionUpdate);
    return () => { editor.off("selectionUpdate", handleSelectionUpdate); };
  }, [editor]);

  const handleSave = useCallback(async () => {
    if (!editor) return;
    setAutoSaveStatus("saving");
    try {
      await onSave(editor.getJSON(), editor.getHTML());
      setAutoSaveStatus("saved");
    } catch {
      setAutoSaveStatus("unsaved");
    }
  }, [editor, onSave]);

  const handleExportMarkdown = () => {
    if (!editor) return;
    const md = tiptapToMarkdown(editor.getJSON());
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notulensi.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => window.print();

  const handleImportMarkdown = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const md = ev.target?.result as string;
      editor.commands.setContent(markdownToHtml(md));
      toast.success("Notulensi berhasil diimpor");
      handleSave();
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleOpenFollowUpDialog = () => {
    setFollowUpForm({ title: "", priority: "medium", description: "" });
    setAssignees([]);
    setDialogOpen(true);
    setShowFollowUpButton(false);
  };

  const handleAddAssignee = (userId: number, userName: string) => {
    if (assignees.some((a) => a.user_id === userId)) return;
    setAssignees((prev) => [...prev, { user_id: userId, name: userName, deadline: defaultDeadline }]);
    setUserSearchOpen(false);
  };

  const handleRemoveAssignee = (userId: number) => {
    setAssignees((prev) => prev.filter((a) => a.user_id !== userId));
  };

  const handleAssigneeDeadlineChange = (userId: number, deadline: string) => {
    setAssignees((prev) => prev.map((a) => (a.user_id === userId ? { ...a, deadline } : a)));
  };

  const handleCreateFollowUp = async () => {
    if (!followUpForm.title.trim()) {
      toast.error("Judul follow-up wajib diisi");
      return;
    }
    for (const a of assignees) {
      if (!a.deadline) {
        toast.error(`Deadline untuk ${a.name} wajib diisi`);
        return;
      }
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {
        meeting_note_id: noteId,
        highlighted_text: selectedText,
        title: followUpForm.title,
        priority: followUpForm.priority,
        description: followUpForm.description || null,
      };
      if (assignees.length > 0) {
        payload.assignees = assignees.map((a) => ({ user_id: a.user_id, deadline: a.deadline }));
      }
      await createFollowUp.mutateAsync(payload);
      if (editor) editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run();
      toast.success(
        assignees.length > 0
          ? `Follow-up berhasil dibuat & ditugaskan ke ${assignees.length} karyawan`
          : "Follow-up berhasil dibuat"
      );
      setDialogOpen(false);
      setFollowUpForm({ title: "", priority: "medium", description: "" });
      setAssignees([]);
    } catch {
      toast.error("Gagal membuat follow-up");
    }
  };

  const availableUsers = (users ?? []).filter(
    (u) => !assignees.some((a) => a.user_id === u.id)
  );

  if (!editor) {
    return (
      <div className="flex items-center justify-center min-h-[400px] border rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white shadow-sm" ref={editorContainerRef}>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="border-b bg-muted/30 rounded-t-lg">

        {/* Row 1: formatting */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 pt-2 pb-1">

          {/* History */}
          <ToolBtn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo className="h-3.5 w-3.5" />
          </ToolBtn>

          <Divider />

          {/* Headings */}
          <ToolBtn title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="h-3.5 w-3.5" />
          </ToolBtn>

          <Divider />

          {/* Inline marks */}
          <ToolBtn title="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Underline (Ctrl+U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Inline Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code className="h-3.5 w-3.5" />
          </ToolBtn>

          {/* Text color picker */}
          <div className="relative" title="Warna Teks">
            <label className="cursor-pointer">
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 pointer-events-none" type="button" tabIndex={-1}>
                <span className="font-bold text-xs" style={{ color: editor.getAttributes("textStyle").color || "currentColor" }}>A</span>
              </Button>
              <input
                type="color"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                value={editor.getAttributes("textStyle").color || "#000000"}
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              />
            </label>
          </div>

          {/* Highlight color picker */}
          <div className="relative" title="Warna Sorot">
            <label className="cursor-pointer">
              <Button variant={editor.isActive("highlight") ? "secondary" : "ghost"} size="icon" className="h-7 w-7 shrink-0 pointer-events-none" type="button" tabIndex={-1}>
                <Highlighter className="h-3.5 w-3.5" />
              </Button>
              <input
                type="color"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                value="#fef08a"
                onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
              />
            </label>
          </div>

          <Divider />

          {/* Alignment */}
          <ToolBtn title="Rata Kiri" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Rata Tengah" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
            <AlignCenter className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Rata Kanan" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
            <AlignRight className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Rata Penuh" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
            <AlignJustify className="h-3.5 w-3.5" />
          </ToolBtn>

          <Divider />

          {/* Lists */}
          <ToolBtn title="Bullet List" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Numbered List" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Garis Pemisah" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus className="h-3.5 w-3.5" />
          </ToolBtn>
        </div>

        {/* Row 2: actions */}
        <div className="flex items-center gap-1 px-2 pb-2">
          {/* Auto-save status */}
          <span className="text-xs text-muted-foreground mr-1">
            {autoSaveStatus === "saving" && "Menyimpan..."}
            {autoSaveStatus === "saved" && "Tersimpan"}
            {autoSaveStatus === "unsaved" && "Belum disimpan"}
          </span>

          <div className="flex-1" />

          {/* Import */}
          <input ref={importFileRef} type="file" accept=".md,.txt" className="hidden" onChange={handleImportMarkdown} />
          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => importFileRef.current?.click()} title="Import dari Markdown (.md)">
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Import</span>
          </Button>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportMarkdown} className="gap-2">
                <Download className="h-4 w-4 text-muted-foreground" />
                Export Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf} className="gap-2">
                <Printer className="h-4 w-4 text-muted-foreground" />
                Export PDF (Print)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Divider />

          {/* Save */}
          <Button variant="default" size="sm" onClick={handleSave} className="gap-1.5 h-7 text-xs">
            <Save className="h-3.5 w-3.5" />
            Simpan
          </Button>
        </div>
      </div>

      {/* ── Editor content ───────────────────────────────────────────────────── */}
      <div className="relative bg-white rounded-b-lg">
        <EditorContent editor={editor} />

        {/* Floating follow-up button */}
        {showFollowUpButton && (
          <div className="absolute z-10" style={{ top: `${followUpPosition.top}px`, left: `${followUpPosition.left}px` }}>
            <Button size="sm" variant="default" className="gap-1.5 shadow-lg text-xs" onClick={handleOpenFollowUpDialog}>
              <MessageSquarePlus className="h-3.5 w-3.5" />
              Buat Follow-Up
            </Button>
          </div>
        )}
      </div>

      {/* ── Follow-Up Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Follow-Up</DialogTitle>
            <DialogDescription>
              Buat item follow-up dari teks yang dipilih. Anda juga bisa langsung menugaskan ke karyawan.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="highlighted_text">Teks yang Dipilih</Label>
              <div className="rounded-md border bg-muted/50 p-3 text-sm">
                <span className="bg-yellow-200 px-1">{selectedText}</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="follow_up_title">Judul <span className="text-red-500">*</span></Label>
              <Input
                id="follow_up_title"
                placeholder="Masukkan judul follow-up"
                value={followUpForm.title}
                onChange={(e) => setFollowUpForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="follow_up_priority">Prioritas</Label>
              <Select value={followUpForm.priority} onValueChange={(value: Priority) => setFollowUpForm((prev) => ({ ...prev, priority: value }))}>
                <SelectTrigger><SelectValue placeholder="Pilih prioritas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="follow_up_description">Deskripsi (opsional)</Label>
              <Textarea
                id="follow_up_description"
                placeholder="Tambahkan deskripsi..."
                rows={3}
                value={followUpForm.description}
                onChange={(e) => setFollowUpForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label>Tugaskan ke Karyawan (opsional)</Label>
                <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <UserPlus className="h-3.5 w-3.5" />
                      Tambah
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Cari karyawan..." />
                      <CommandList>
                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {availableUsers.map((user) => (
                            <CommandItem key={user.id} value={user.name} onSelect={() => handleAddAssignee(user.id, user.name)}>
                              <div className="flex flex-col">
                                <span className="text-sm">{user.name}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
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
                  Belum ada karyawan yang ditugaskan. Follow-up akan dibuat dengan status &quot;Open&quot;.
                </p>
              ) : (
                <div className="space-y-2">
                  {assignees.map((assignee) => (
                    <div key={assignee.user_id} className="flex items-center gap-2 rounded-lg border p-2.5">
                      <div className="flex-1 min-w-0">
                        <Badge variant="secondary" className="text-xs mb-1.5">{assignee.name}</Badge>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground shrink-0">Deadline:</Label>
                          <Input
                            type="date"
                            className="h-7 text-xs [color-scheme:light]"
                            value={assignee.deadline}
                            min={new Date().toISOString().split("T")[0]}
                            onChange={(e) => handleAssigneeDeadlineChange(assignee.user_id, e.target.value)}
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleCreateFollowUp} disabled={createFollowUp.isPending}>
              {createFollowUp.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {assignees.length > 0 ? `Simpan & Tugaskan (${assignees.length})` : "Simpan Follow-Up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
