"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/layout/PageHeader";
import {
  Loader2,
  Plus,
  Pencil,
  Users,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import { toast } from "sonner";
import type { User, ApiResponse } from "@/types/api";

interface UserFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  position: string;
  department: string;
  roles: string[];
}

const emptyForm: UserFormData = {
  name: "",
  email: "",
  password: "",
  phone: "",
  position: "",
  department: "",
  roles: ["staff"],
};

const availableRoles = [
  { value: "super-admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "noter", label: "Noter (Notulis)" },
  { value: "kabag", label: "Kabag" },
  { value: "sdm", label: "SDM" },
  { value: "staff", label: "Staff" },
];

function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<User[]>>("/api/v1/users");
      return data.data;
    },
  });
}

function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UserFormData) => {
      const { data } = await api.post("/api/v1/users", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

function useUpdateUser(id: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<UserFormData>) => {
      if (!id) throw new Error("User ID required");
      const { data } = await api.put(`/api/v1/users/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export default function UsersPage() {
  const { hasRole } = useAuthStore();
  const isSuperAdmin = hasRole("super-admin");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);

  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(editingUser?.id ?? null);

  // Access check
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <ShieldAlert className="h-12 w-12 mb-4 text-red-400" />
        <h2 className="text-lg font-semibold text-foreground">
          Akses Ditolak
        </h2>
        <p className="text-sm mt-1">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      phone: user.phone ?? "",
      position: user.position ?? "",
      department: user.department ?? "",
      roles: user.roles?.length ? user.roles : ["staff"],
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Nama dan email wajib diisi");
      return;
    }
    if (form.roles.length === 0) {
      toast.error("Pilih minimal satu role");
      return;
    }

    try {
      if (editingUser) {
        // Update - omit password if empty
        const payload: Partial<UserFormData> = { ...form };
        if (!payload.password) {
          delete payload.password;
        }
        await updateUser.mutateAsync(payload);
        toast.success("User berhasil diperbarui");
      } else {
        if (!form.password) {
          toast.error("Password wajib diisi untuk user baru");
          return;
        }
        await createUser.mutateAsync(form);
        toast.success("User berhasil dibuat");
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingUser(null);
    } catch {
      toast.error(editingUser ? "Gagal memperbarui user" : "Gagal membuat user");
    }
  };

  const isPending = createUser.isPending || updateUser.isPending;

  return (
    <div className="space-y-6">
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-white/60" />
              Manajemen User
            </h1>
            <p className="text-white/80 mt-1">
              Kelola akun pengguna aplikasi.
            </p>
          </div>
          <Button onClick={handleOpenCreate} variant="secondary" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Tambah User
          </Button>
        </div>
      </PageHeader>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !users || users.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-white text-muted-foreground">
          <Users className="h-10 w-10 mb-3" />
          <p className="text-sm font-medium">Belum ada user</p>
        </div>
      ) : (
        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>No. HP</TableHead>
                <TableHead>Posisi</TableHead>
                <TableHead>Departemen</TableHead>
                <TableHead className="w-[100px]">Role</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.phone ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.position ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.department ?? "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(user.roles?.length ? user.roles : ["staff"]).map((role) => (
                        <Badge key={role} variant="outline" className="capitalize">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge className="bg-green-100 text-green-700">
                        Aktif
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700">
                        Nonaktif
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Tambah User Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Perbarui informasi pengguna."
                : "Isi data berikut untuk membuat akun pengguna baru."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="user_name">
                Nama <span className="text-red-500">*</span>
              </Label>
              <Input
                id="user_name"
                placeholder="Nama lengkap"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="user_email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="user_email"
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Label htmlFor="user_password">
                Password{" "}
                {!editingUser && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="user_password"
                type="password"
                placeholder={
                  editingUser
                    ? "Kosongkan jika tidak ingin mengubah"
                    : "Minimal 8 karakter"
                }
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>

            {/* Phone */}
            <div className="grid gap-2">
              <Label htmlFor="user_phone">No. HP (WhatsApp)</Label>
              <Input
                id="user_phone"
                type="tel"
                placeholder="Contoh: 628123456789"
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Format: 628xxx (tanpa + atau 0). Digunakan untuk notifikasi WhatsApp.
              </p>
            </div>

            {/* Position */}
            <div className="grid gap-2">
              <Label htmlFor="user_position">Posisi</Label>
              <Input
                id="user_position"
                placeholder="Contoh: Manager, Staff"
                value={form.position}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, position: e.target.value }))
                }
              />
            </div>

            {/* Department */}
            <div className="grid gap-2">
              <Label htmlFor="user_department">Departemen</Label>
              <Input
                id="user_department"
                placeholder="Contoh: IT, HR, Finance"
                value={form.department}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, department: e.target.value }))
                }
              />
            </div>

            {/* Roles */}
            <div className="grid gap-2">
              <Label>Role <span className="text-red-500">*</span></Label>
              <p className="text-xs text-muted-foreground">Bisa pilih lebih dari satu role.</p>
              <div className="grid grid-cols-2 gap-2">
                {availableRoles.map((role) => (
                  <label
                    key={role.value}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                      form.roles.includes(role.value)
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.roles.includes(role.value)}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          roles: e.target.checked
                            ? [...prev.roles, role.value]
                            : prev.roles.filter((r) => r !== role.value),
                        }));
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{role.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditingUser(null);
                setForm(emptyForm);
              }}
            >
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingUser ? "Simpan Perubahan" : "Buat User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
