import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#063E66] text-white flex-col justify-between p-12 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.07]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Gradient Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#1C61A2] rounded-full opacity-30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-[#BEDBED] rounded-full opacity-10 blur-3xl" />

        {/* Top Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Simonik" width={40} height={40} className="rounded-lg" />
            <span className="text-xl font-bold tracking-tight">Simonik</span>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">
              Kolaborasi Tim,<br />
              <span className="text-[#BEDBED]">Satu Platform.</span>
            </h2>
            <p className="text-white/70 text-lg max-w-md leading-relaxed">
              Kelola meeting, catat notulensi, dan pantau tindak lanjut dalam satu aplikasi terintegrasi.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BEDBED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Notulensi Real-time</p>
                <p className="text-sm text-white/60">Editor kolaboratif untuk mencatat poin penting meeting.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BEDBED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" /><path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Follow-Up & Task</p>
                <p className="text-sm text-white/60">Ubah hasil meeting menjadi tugas terukur dengan deadline.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BEDBED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Notifikasi Multi-Channel</p>
                <p className="text-sm text-white/60">Undangan via Email, WhatsApp, dan Google Calendar.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-sm text-white/40">&copy; 2026 Simonik. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
