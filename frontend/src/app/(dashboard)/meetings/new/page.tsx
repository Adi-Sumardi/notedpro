"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateMeeting } from "@/hooks/useMeetings";
import { toast } from "sonner";
import type { User, ExternalContact } from "@/types/api";
import api from "@/lib/api";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, X, Plus, UserPlus, FileText, Upload } from "lucide-react";
import { useRef } from "react";

const meetingSchema = z.object({
  title: z
    .string()
    .min(1, "Judul meeting wajib diisi")
    .max(255, "Judul maksimal 255 karakter"),
  description: z.string().optional(),
  meeting_date: z.string().min(1, "Tanggal meeting wajib diisi"),
  location_type: z.enum(["offline", "online"]),
  location: z.string().optional(),
  meeting_link: z.string().optional(),
  meeting_passcode: z.string().optional(),
  organizer: z.string().optional(),
});

type MeetingFormValues = z.infer<typeof meetingSchema>;

interface SelectedExternal {
  contact: ExternalContact;
  isNew: boolean;
}

export default function NewMeetingPage() {
  const router = useRouter();
  const createMeeting = useCreateMeeting();

  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>([]);

  // External contacts
  const [externalContacts, setExternalContacts] = useState<ExternalContact[]>([]);
  const [selectedExternals, setSelectedExternals] = useState<SelectedExternal[]>([]);
  const [showNewContactDialog, setShowNewContactDialog] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    position: "",
  });

  // Attachment
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: "",
      description: "",
      meeting_date: "",
      location_type: "offline",
      location: "",
      meeting_link: "",
      meeting_passcode: "",
      organizer: "",
    },
  });

  const locationType = watch("location_type");

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, contactsRes] = await Promise.all([
          api.get("/api/v1/users"),
          api.get("/api/v1/external-contacts"),
        ]);
        setUsers(usersRes.data?.data ?? []);
        setExternalContacts(contactsRes.data?.data ?? []);
      } catch {
        toast.error("Gagal memuat data.");
      } finally {
        setUsersLoading(false);
      }
    }
    fetchData();
  }, []);

  const availableUsers = users.filter(
    (u) => !selectedParticipants.some((p) => p.id === u.id)
  );

  const availableExternals = externalContacts.filter(
    (c) => !selectedExternals.some((s) => s.contact.id === c.id)
  );

  function addParticipant(userId: string) {
    const user = users.find((u) => String(u.id) === userId);
    if (user && !selectedParticipants.some((p) => p.id === user.id)) {
      setSelectedParticipants((prev) => [...prev, user]);
    }
  }

  function removeParticipant(userId: number) {
    setSelectedParticipants((prev) => prev.filter((p) => p.id !== userId));
  }

  function addExternalContact(contactId: string) {
    const contact = externalContacts.find((c) => String(c.id) === contactId);
    if (contact && !selectedExternals.some((s) => s.contact.id === contact.id)) {
      setSelectedExternals((prev) => [...prev, { contact, isNew: false }]);
    }
  }

  function removeExternal(contactId: number) {
    setSelectedExternals((prev) => prev.filter((s) => s.contact.id !== contactId));
  }

  function handleAddNewContact() {
    if (!newContact.name.trim()) {
      toast.error("Nama kontak wajib diisi");
      return;
    }
    if (!newContact.email.trim() && !newContact.phone.trim()) {
      toast.error("Email atau No. HP wajib diisi minimal satu");
      return;
    }

    const tempId = -Date.now();
    const contact: ExternalContact = {
      id: tempId,
      name: newContact.name,
      email: newContact.email || null,
      phone: newContact.phone || null,
      organization: newContact.organization || null,
      position: newContact.position || null,
    };

    setSelectedExternals((prev) => [...prev, { contact, isNew: true }]);
    setNewContact({ name: "", email: "", phone: "", organization: "", position: "" });
    setShowNewContactDialog(false);
  }

  async function onSubmit(values: MeetingFormValues) {
    try {
      const participants = selectedParticipants.map((p) => ({
        user_id: p.id,
        role: "participant",
      }));
      const externalParticipants = selectedExternals.map((s) =>
        s.isNew
          ? {
              name: s.contact.name,
              email: s.contact.email,
              phone: s.contact.phone,
              organization: s.contact.organization,
              position: s.contact.position,
              role: "participant",
            }
          : {
              id: s.contact.id,
              role: "participant",
            }
      );

      if (attachment) {
        const formData = new FormData();
        formData.append("title", values.title);
        if (values.description) formData.append("description", values.description);
        formData.append("meeting_date", values.meeting_date);
        formData.append("location_type", values.location_type);
        if (values.location) formData.append("location", values.location);
        if (values.meeting_link) formData.append("meeting_link", values.meeting_link);
        if (values.meeting_passcode) formData.append("meeting_passcode", values.meeting_passcode);
        if (values.organizer) formData.append("organizer", values.organizer);
        formData.append("attachment", attachment);

        participants.forEach((p, i) => {
          formData.append(`participants[${i}][user_id]`, String(p.user_id));
          formData.append(`participants[${i}][role]`, p.role);
        });

        externalParticipants.forEach((ep, i) => {
          Object.entries(ep).forEach(([key, val]) => {
            if (val !== null && val !== undefined) {
              formData.append(`external_participants[${i}][${key}]`, String(val));
            }
          });
        });

        await createMeeting.mutateAsync(formData);
      } else {
        await createMeeting.mutateAsync({
          ...values,
          participants,
          external_participants: externalParticipants,
        });
      }

      toast.success("Meeting berhasil dibuat!");
      router.push("/meetings");
    } catch {
      toast.error("Gagal membuat meeting. Silakan coba lagi.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Buat Meeting Baru</h1>
        <p className="text-muted-foreground">
          Isi detail meeting untuk mulai mencatat.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Meeting Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Meeting</CardTitle>
            <CardDescription>
              Informasi dasar tentang meeting yang akan dilaksanakan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Judul Meeting <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Contoh: Sprint Planning Q1 2026"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Deskripsi atau agenda meeting..."
                rows={4}
                {...register("description")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting_date">
                Tanggal & Waktu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="meeting_date"
                type="datetime-local"
                {...register("meeting_date")}
              />
              {errors.meeting_date && (
                <p className="text-sm text-red-500">
                  {errors.meeting_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipe Lokasi</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="offline"
                    checked={locationType === "offline"}
                    onChange={() => setValue("location_type", "offline")}
                    className="accent-primary"
                  />
                  <span className="text-sm">Offline</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="online"
                    checked={locationType === "online"}
                    onChange={() => setValue("location_type", "online")}
                    className="accent-primary"
                  />
                  <span className="text-sm">Online</span>
                </label>
              </div>
            </div>

            {locationType === "offline" ? (
              <div className="space-y-2">
                <Label htmlFor="location">Lokasi</Label>
                <Input
                  id="location"
                  placeholder="Contoh: Ruang Meeting Lantai 3"
                  {...register("location")}
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="meeting_link">
                    Link Meeting <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="meeting_link"
                    placeholder="Contoh: https://zoom.us/j/123456789"
                    {...register("meeting_link")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting_passcode">Passcode</Label>
                  <Input
                    id="meeting_passcode"
                    placeholder="Opsional"
                    {...register("meeting_passcode")}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="organizer">Penyelenggara</Label>
              <Input
                id="organizer"
                placeholder="Contoh: BPH, Keuangan, SDM, Sekretariat"
                {...register("organizer")}
              />
            </div>

            <div className="space-y-2">
              <Label>Lampiran (PDF)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error("Ukuran file maksimal 10MB");
                      return;
                    }
                    setAttachment(file);
                  }
                }}
              />
              {attachment ? (
                <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
                  <FileText className="h-5 w-5 text-red-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(attachment.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachment(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="rounded-full p-1 hover:bg-muted shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Pilih File PDF
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Opsional. Format PDF, maksimal 10MB.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Internal Participants */}
        <Card>
          <CardHeader>
            <CardTitle>Peserta Internal</CardTitle>
            <CardDescription>
              Pilih anggota tim yang terdaftar di aplikasi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tambah Peserta</Label>
              <Select
                onValueChange={addParticipant}
                disabled={usersLoading || availableUsers.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      usersLoading
                        ? "Memuat pengguna..."
                        : availableUsers.length === 0
                        ? "Semua pengguna sudah ditambahkan"
                        : "Pilih peserta..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} ({u.position ?? u.roles?.[0] ?? "-"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedParticipants.length > 0 && (
              <div className="space-y-2">
                <Label>Peserta Terpilih ({selectedParticipants.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedParticipants.map((p) => (
                    <Badge
                      key={p.id}
                      variant="secondary"
                      className="flex items-center gap-1 py-1 pl-3 pr-1"
                    >
                      {p.name}
                      <button
                        type="button"
                        onClick={() => removeParticipant(p.id)}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* External Participants */}
        <Card>
          <CardHeader>
            <CardTitle>Peserta Eksternal</CardTitle>
            <CardDescription>
              Tambahkan stakeholder atau pihak luar yang tidak memiliki akun. Mereka akan menerima undangan via Email dan WhatsApp.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  onValueChange={addExternalContact}
                  disabled={usersLoading || availableExternals.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        availableExternals.length === 0
                          ? "Belum ada kontak eksternal"
                          : "Pilih dari daftar kontak..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableExternals.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                        {c.organization ? ` — ${c.organization}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewContactDialog(true)}
                className="gap-1.5 shrink-0"
              >
                <UserPlus className="h-4 w-4" />
                Kontak Baru
              </Button>
            </div>

            {selectedExternals.length > 0 && (
              <div className="space-y-2">
                <Label>Peserta Eksternal ({selectedExternals.length})</Label>
                <div className="space-y-2">
                  {selectedExternals.map((s) => (
                    <div
                      key={s.contact.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {s.contact.name}
                          {s.isNew && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Baru
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {[s.contact.organization, s.contact.email, s.contact.phone]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExternal(s.contact.id)}
                        className="ml-2 rounded-full p-1 hover:bg-muted shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={isSubmitting || createMeeting.isPending}
          >
            {(isSubmitting || createMeeting.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Buat Meeting
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Batal
          </Button>
        </div>
      </form>

      {/* New External Contact Dialog */}
      <Dialog open={showNewContactDialog} onOpenChange={setShowNewContactDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Tambah Kontak Eksternal Baru</DialogTitle>
            <DialogDescription>
              Data kontak akan tersimpan dan bisa digunakan kembali untuk meeting selanjutnya.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="ext_name">
                Nama <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ext_name"
                placeholder="Nama lengkap"
                value={newContact.name}
                onChange={(e) =>
                  setNewContact((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ext_email">Email</Label>
              <Input
                id="ext_email"
                type="email"
                placeholder="email@example.com"
                value={newContact.email}
                onChange={(e) =>
                  setNewContact((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ext_phone">No. HP (WhatsApp)</Label>
              <Input
                id="ext_phone"
                type="tel"
                placeholder="628123456789"
                value={newContact.phone}
                onChange={(e) =>
                  setNewContact((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Format: 628xxx (tanpa + atau 0)
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ext_org">Organisasi / Perusahaan</Label>
              <Input
                id="ext_org"
                placeholder="Contoh: PT ABC, Dinas XYZ"
                value={newContact.organization}
                onChange={(e) =>
                  setNewContact((prev) => ({ ...prev, organization: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ext_position">Jabatan</Label>
              <Input
                id="ext_position"
                placeholder="Contoh: Direktur, Manager"
                value={newContact.position}
                onChange={(e) =>
                  setNewContact((prev) => ({ ...prev, position: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewContactDialog(false);
                setNewContact({ name: "", email: "", phone: "", organization: "", position: "" });
              }}
            >
              Batal
            </Button>
            <Button onClick={handleAddNewContact} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
