interface PageHeaderProps {
  children: React.ReactNode;
}

export default function PageHeader({ children }: PageHeaderProps) {
  return (
    <div className="mb-6 relative overflow-hidden bg-[#063E66] rounded-2xl px-5 py-6 md:px-8 md:py-8 text-white shadow-lg">
      {/* Decorative ornaments */}
      <div className="pointer-events-none absolute inset-0">
        {/* Large circle — top right */}
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-[#1C61A2] opacity-50" />
        {/* Medium circle — bottom left */}
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-[#1C61A2] opacity-30" />
        {/* Small accent circle — top left */}
        <div className="absolute top-4 left-[30%] h-24 w-24 rounded-full bg-[#BEDBED] opacity-10" />
        {/* Dot pattern — right side */}
        <div className="absolute top-1/2 right-[15%] -translate-y-1/2 h-32 w-32 rounded-full bg-[#BEDBED] opacity-[0.07]" />
        {/* Subtle line accent */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#BEDBED]/30 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {children}
      </div>
    </div>
  );
}
