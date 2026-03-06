interface PageHeaderProps {
  children: React.ReactNode;
}

export default function PageHeader({ children }: PageHeaderProps) {
  return (
    <div className="-mx-4 -mt-4 md:-mx-6 md:-mt-6 mb-6 bg-gradient-to-r from-[#063E66] via-[#1C61A2] to-[#BEDBED] px-4 py-6 md:px-6 md:py-8 text-white">
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </div>
  );
}
