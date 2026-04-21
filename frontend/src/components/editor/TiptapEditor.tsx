"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
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
  ChevronDown,
  FileText,
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

// ─── Font Size Extension ───────────────────────────────────────────────────────
const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace("pt", "") || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}pt` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ chain }: { chain: () => any }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ chain }: { chain: () => any }) => {
          return chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run();
        },
    };
  },
});

// ─── Font Family Extension ─────────────────────────────────────────────────────
const FontFamily = Extension.create({
  name: "fontFamily",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) => element.style.fontFamily || null,
            renderHTML: (attributes) => {
              if (!attributes.fontFamily) return {};
              return { style: `font-family: ${attributes.fontFamily}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontFamily:
        (fontFamily: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ chain }: { chain: () => any }) => {
          return chain().setMark("textStyle", { fontFamily }).run();
        },
      unsetFontFamily:
        () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ chain }: { chain: () => any }) => {
          return chain().setMark("textStyle", { fontFamily: null }).removeEmptyTextStyle().run();
        },
    };
  },
});

// ─── Tab key Extension ─────────────────────────────────────────────────────────
const TabKey = Extension.create({
  name: "tabKey",
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        return this.editor.commands.insertContent("\u00a0\u00a0\u00a0\u00a0");
      },
    };
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface Assignee {
  user_id: number;
  name: string;
  deadline: string;
}

interface TiptapEditorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  contentHtml?: string | null;
  onSave: (json: unknown, html: string) => Promise<void> | void;
  meetingId: number;
  noteId: number | undefined;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FONT_FAMILIES = [
  { label: "Times New Roman", value: "Times New Roman, serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Calibri", value: "Calibri, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Tahoma", value: "Tahoma, sans-serif" },
  { label: "Courier New", value: "Courier New, monospace" },
  { label: "Trebuchet MS", value: "Trebuchet MS, sans-serif" },
];

const FONT_SIZES = ["8", "9", "10", "11", "12", "14", "16", "18", "20", "22", "24", "26", "28", "36", "48", "72"];

const DEFAULT_FONT_FAMILY = "Times New Roman, serif";
const DEFAULT_FONT_SIZE = "12";

// ─── Toolbar helpers ──────────────────────────────────────────────────────────
function Divider() {
  return <div className="w-px bg-gray-300 mx-1 shrink-0" style={{ height: "20px" }} />;
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
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center rounded
        h-7 w-7 shrink-0 text-gray-700 transition-colors
        hover:bg-blue-100 hover:text-blue-700
        disabled:opacity-40 disabled:cursor-not-allowed
        ${active ? "bg-blue-200 text-blue-800 shadow-inner" : ""}
      `}
    >
      {children}
    </button>
  );
}

// ─── Ruler ─────────────────────────────────────────────────────────────────────
function Ruler() {
  const marks = Array.from({ length: 17 }, (_, i) => i); // 0..16 cm
  return (
    <div
      className="relative flex items-end select-none overflow-hidden"
      style={{
        height: "20px",
        backgroundColor: "#f0f0f0",
        borderBottom: "1px solid #d0d0d0",
        paddingLeft: "96px", // match page left margin (1 inch ~ 96px)
        paddingRight: "96px",
      }}
    >
      <div className="relative flex-1 flex items-end">
        {marks.map((i) => (
          <div
            key={i}
            className="absolute flex flex-col items-center"
            style={{ left: `${(i / 16) * 100}%`, transform: "translateX(-50%)" }}
          >
            <span className="text-[8px] text-gray-500 leading-none mb-0.5">{i}</span>
            <div className="w-px bg-gray-400" style={{ height: i % 2 === 0 ? "6px" : "4px" }} />
          </div>
        ))}
      </div>
    </div>
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
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [currentFontFamily, setCurrentFontFamily] = useState(DEFAULT_FONT_FAMILY);
  const [currentFontSize, setCurrentFontSize] = useState(DEFAULT_FONT_SIZE);
  const [fontSizeInput, setFontSizeInput] = useState(DEFAULT_FONT_SIZE);

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
      FontSize,
      FontFamily,
      TabKey,
    ],
    content: content || undefined,
    editorProps: {
      attributes: {
        class: "focus:outline-none",
        style: `font-family: ${DEFAULT_FONT_FAMILY}; font-size: ${DEFAULT_FONT_SIZE}pt; line-height: 1.6; min-height: 800px;`,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      setAutoSaveStatus("unsaved");
      // Update font state from cursor position
      const attrs = currentEditor.getAttributes("textStyle");
      if (attrs.fontFamily) setCurrentFontFamily(attrs.fontFamily);
      if (attrs.fontSize) {
        setCurrentFontSize(attrs.fontSize);
        setFontSizeInput(attrs.fontSize);
      }
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        setAutoSaveStatus("saving");
        onSaveRef.current(currentEditor.getJSON(), currentEditor.getHTML());
        setAutoSaveStatus("saved");
      }, 3000);
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      const attrs = currentEditor.getAttributes("textStyle");
      if (attrs.fontFamily) setCurrentFontFamily(attrs.fontFamily);
      else setCurrentFontFamily(DEFAULT_FONT_FAMILY);
      if (attrs.fontSize) {
        setCurrentFontSize(attrs.fontSize);
        setFontSizeInput(attrs.fontSize);
      } else {
        setCurrentFontSize(DEFAULT_FONT_SIZE);
        setFontSizeInput(DEFAULT_FONT_SIZE);
      }
    },
  });

  // Load HTML fallback
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

  const applyFontFamily = (val: string) => {
    if (!editor) return;
    setCurrentFontFamily(val);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor.chain().focus() as any).setFontFamily(val).run();
  };

  const applyFontSize = (val: string) => {
    if (!editor) return;
    const size = parseInt(val, 10);
    if (isNaN(size) || size < 1 || size > 400) return;
    setCurrentFontSize(val);
    setFontSizeInput(val);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor.chain().focus() as any).setFontSize(val).run();
  };

  const handleFontSizeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") applyFontSize(fontSizeInput);
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

  const currentFontLabel = FONT_FAMILIES.find(f => f.value === currentFontFamily)?.label ?? "Times New Roman";

  if (!editor) {
    return (
      <div className="flex items-center justify-center min-h-[400px] rounded-lg border bg-gray-100">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* ── Print Styles ─────────── */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            header, nav, aside, footer,
            [data-sidebar], [data-radix-popper-content-wrapper],
            .print-hidden { display: none !important; }
            body { background: white !important; margin: 0; }
            .wordpad-page {
              box-shadow: none !important;
              margin: 0 !important;
              padding: 1in 1in 1in 1in !important;
              width: 100% !important;
              min-height: unset !important;
            }
            .wordpad-toolbar, .wordpad-ruler, .wordpad-statusbar { display: none !important; }
            .wordpad-canvas { background: white !important; padding: 0 !important; }
          }
          .wordpad-page .ProseMirror { outline: none; }
          .wordpad-page .ProseMirror p.is-editor-empty:first-child::before {
            color: #adb5bd;
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
          .wordpad-page .ProseMirror h1 { font-size: 24pt; font-weight: bold; margin: 0.5em 0; }
          .wordpad-page .ProseMirror h2 { font-size: 18pt; font-weight: bold; margin: 0.4em 0; }
          .wordpad-page .ProseMirror h3 { font-size: 14pt; font-weight: bold; margin: 0.3em 0; }
          .wordpad-page .ProseMirror ul { list-style-type: disc; padding-left: 1.5em; margin: 0.3em 0; }
          .wordpad-page .ProseMirror ol { list-style-type: decimal; padding-left: 1.5em; margin: 0.3em 0; }
          .wordpad-page .ProseMirror blockquote { border-left: 3px solid #ccc; padding-left: 1em; color: #555; margin: 0.5em 0; }
          .wordpad-page .ProseMirror code { background: #f0f0f0; padding: 0.1em 0.3em; border-radius: 3px; font-family: "Courier New", monospace; font-size: 0.9em; }
          .wordpad-page .ProseMirror pre { background: #f5f5f5; padding: 0.75em 1em; border-radius: 4px; overflow-x: auto; }
          .wordpad-page .ProseMirror hr { border: none; border-top: 1px solid #ccc; margin: 1em 0; }
          .wordpad-page .ProseMirror mark { border-radius: 2px; padding: 0 2px; }
        `
      }} />

      {/* ── WordPad Shell ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col rounded-lg overflow-hidden shadow-md border border-gray-300" style={{ background: "#f3f3f3" }}>

        {/* ── Title Bar ── */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border-b border-gray-200 print-hidden wordpad-toolbar">
          <FileText className="h-4 w-4 text-blue-600 shrink-0" />
          <span className="text-xs font-semibold text-gray-700 flex-1">Notulensi Rapat — Word Processor</span>
          {/* Auto-save indicator */}
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            autoSaveStatus === "saving" ? "bg-yellow-100 text-yellow-700" :
            autoSaveStatus === "saved" ? "bg-green-100 text-green-700" :
            "bg-red-100 text-red-700"
          }`}>
            {autoSaveStatus === "saving" && "⏳ Menyimpan..."}
            {autoSaveStatus === "saved" && "✓ Tersimpan"}
            {autoSaveStatus === "unsaved" && "● Belum disimpan"}
          </span>
        </div>

        {/* ── Toolbar Row 1: Font & Size ──────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 bg-white border-b border-gray-200 print-hidden wordpad-toolbar">

          {/* Undo / Redo */}
          <ToolBtn title="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Redo (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo className="h-3.5 w-3.5" />
          </ToolBtn>

          <Divider />

          {/* Font Family Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 h-7 px-2 rounded border border-gray-300 bg-white hover:border-blue-400 text-xs text-gray-700 min-w-[140px] max-w-[160px] truncate transition"
                title="Jenis Huruf"
              >
                <span className="flex-1 text-left truncate" style={{ fontFamily: currentFontFamily }}>
                  {currentFontLabel}
                </span>
                <ChevronDown className="h-3 w-3 shrink-0 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {FONT_FAMILIES.map((f) => (
                <DropdownMenuItem
                  key={f.value}
                  onClick={() => applyFontFamily(f.value)}
                  className="text-sm"
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Font Size: Input + Dropdown */}
          <div className="flex items-center border border-gray-300 bg-white rounded overflow-hidden hover:border-blue-400 transition">
            <input
              type="text"
              className="w-10 h-7 text-xs text-center outline-none px-1 bg-transparent text-gray-700"
              value={fontSizeInput}
              onChange={(e) => setFontSizeInput(e.target.value)}
              onBlur={() => applyFontSize(fontSizeInput)}
              onKeyDown={handleFontSizeKeyDown}
              title="Ukuran Huruf"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="h-7 px-0.5 hover:bg-gray-100 border-l border-gray-300 transition">
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-16 max-h-60 overflow-y-auto">
                {FONT_SIZES.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => applyFontSize(s)}
                    className={`text-xs justify-center ${currentFontSize === s ? "font-bold bg-blue-50" : ""}`}
                  >
                    {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Divider />

          {/* Headings */}
          <ToolBtn title="Judul 1 (H1)" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Judul 2 (H2)" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Judul 3 (H3)" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="h-3.5 w-3.5" />
          </ToolBtn>

          <Divider />

          {/* Inline marks */}
          <ToolBtn title="Tebal (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Miring (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Garis Bawah (Ctrl+U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Coret" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Kode Inline" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code className="h-3.5 w-3.5" />
          </ToolBtn>

          <Divider />

          {/* Text color picker */}
          <div className="relative" title="Warna Teks">
            <label className="cursor-pointer flex items-center justify-center h-7 w-7 rounded hover:bg-blue-100 transition">
              <span className="font-bold text-xs border-b-2" style={{
                color: editor.getAttributes("textStyle").color || "#000000",
                borderColor: editor.getAttributes("textStyle").color || "#000000",
              }}>A</span>
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
            <label className={`cursor-pointer flex items-center justify-center h-7 w-7 rounded hover:bg-blue-100 transition ${editor.isActive("highlight") ? "bg-blue-200" : ""}`}>
              <Highlighter className="h-3.5 w-3.5 text-gray-700" />
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

          {/* Lists & blocks */}
          <ToolBtn title="Daftar Poin" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Daftar Bernomor" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Kutipan" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Garis Pemisah" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus className="h-3.5 w-3.5" />
          </ToolBtn>

          <div className="flex-1" />

          {/* Action buttons */}
          <input ref={importFileRef} type="file" accept=".md,.txt" className="hidden" onChange={handleImportMarkdown} />
          <button
            type="button"
            className="flex items-center gap-1.5 h-7 px-2.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-xs text-gray-700 transition"
            onClick={() => importFileRef.current?.click()}
            title="Import Markdown (.md)"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Import</span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 h-7 px-2.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-xs text-gray-700 transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportMarkdown} className="gap-2 text-xs">
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                Export Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf} className="gap-2 text-xs">
                <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                Export PDF (Print)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Divider />

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 h-7 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            Simpan
          </button>
        </div>

        {/* ── Ruler ─────────────────────────────────────────────────────────── */}
        <Ruler />

        {/* ── Canvas (Page Area) ────────────────────────────────────────────── */}
        <div
          className="wordpad-canvas overflow-y-auto"
          style={{
            background: "#e8e8e8",
            padding: "24px 32px",
            minHeight: "600px",
          }}
        >
          <div
            ref={editorContainerRef}
            className="wordpad-page relative mx-auto bg-white"
            style={{
              width: "210mm",         /* A4 width */
              minHeight: "297mm",     /* A4 height */
              padding: "25.4mm 25.4mm 25.4mm 25.4mm", /* 1 inch margins */
              boxShadow: "0 2px 8px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
              position: "relative",
            }}
          >
            {/* Floating follow-up button */}
            {showFollowUpButton && (
              <div
                className="absolute z-10 print-hidden"
                style={{ top: `${followUpPosition.top}px`, left: `${followUpPosition.left}px` }}
              >
                <Button
                  size="sm"
                  variant="default"
                  className="gap-1.5 shadow-lg text-xs"
                  onClick={handleOpenFollowUpDialog}
                >
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                  Buat Follow-Up
                </Button>
              </div>
            )}

            <EditorContent editor={editor} />
          </div>
        </div>

        {/* ── Status Bar ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-3 py-1 bg-white border-t border-gray-200 print-hidden wordpad-statusbar">
          <span className="text-[10px] text-gray-500">
            Font: <span className="font-medium text-gray-700">{currentFontLabel}</span>
          </span>
          <span className="text-[10px] text-gray-500">
            Ukuran: <span className="font-medium text-gray-700">{currentFontSize}pt</span>
          </span>
          <div className="flex-1" />
          <span className="text-[10px] text-gray-400">A4 · 210 × 297 mm</span>
        </div>
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
    </>
  );
}
