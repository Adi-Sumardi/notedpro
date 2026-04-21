"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AxiosError } from "axios";

import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  useAuth({ middleware: "guest" });

  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 422) {
          // Validation error — ambil pesan dari field errors atau message
          const fieldErrors = data?.errors;
          if (fieldErrors) {
            const firstError = Object.values(fieldErrors).flat()[0];
            setErrorMessage(String(firstError));
          } else {
            setErrorMessage(data?.message || "Data yang dimasukkan tidak valid.");
          }
        } else if (status === 401) {
          setErrorMessage("Email atau password yang Anda masukkan salah.");
        } else if (status === 403) {
          setErrorMessage(data?.message || "Akun Anda tidak aktif. Hubungi administrator.");
        } else if (status >= 500) {
          setErrorMessage("Terjadi gangguan pada server. Silakan coba beberapa saat lagi.");
        } else {
          setErrorMessage(data?.message || "Login gagal. Silakan coba lagi.");
        }
      } else {
        setErrorMessage("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Mobile Logo (hidden on lg) */}
      <div className="flex flex-col items-center lg:hidden">
        <Image src="/logo.png" alt="Simonik" width={64} height={64} className="rounded-xl shadow-lg" />
        <h1 className="mt-3 text-2xl font-bold text-[#063E66]">Simonik</h1>
        <p className="text-sm text-muted-foreground">
          Sistem Manajemen Notulensi dan Kolaborasi
        </p>
      </div>

      {/* Login Card */}
      <Card className="border-0 shadow-xl shadow-gray-200/50">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl">Masuk ke akun Anda</CardTitle>
          <CardDescription>
            Masukkan email dan password untuk melanjutkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Login Gagal</p>
                  <p className="text-sm text-red-600 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-[#1C61A2] hover:bg-[#063E66] text-white font-medium transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer info */}
      <p className="text-center text-xs text-muted-foreground lg:hidden">
        &copy; 2026 Simonik Kolaborasi
      </p>
    </div>
  );
}
