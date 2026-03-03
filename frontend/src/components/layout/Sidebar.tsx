"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Users,
  Pen,
  ClipboardPenLine,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Tasks",
    href: "/my-tasks",
    icon: CheckSquare,
  },
  {
    label: "Laporan Harian",
    href: "/work-logs",
    icon: ClipboardPenLine,
  },
  {
    label: "Meetings",
    href: "/meetings",
    icon: FileText,
    roles: ["admin", "super-admin", "noter"],
  },
  {
    label: "All Tasks",
    href: "/tasks",
    icon: CheckSquare,
    roles: ["admin", "super-admin"],
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
    roles: ["admin", "super-admin"],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, hasRole } = useAuthStore();

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.some((role) => hasRole(role));
  });

  return (
    <div className="flex flex-col h-full bg-[#063E66]">
      {/* App Name */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
        <Pen className="h-5 w-5 text-[#BEDBED]" />
        <span className="text-xl font-bold text-white">NotedPro</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#1C61A2] text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      {user && (
        <div className="border-t border-white/10 px-6 py-4">
          <p className="text-sm font-medium text-white truncate">
            {user.name}
          </p>
          <p className="text-xs text-[#BEDBED] capitalize">{user.roles?.[0]}</p>
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 md:bg-[#063E66] md:z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar via Sheet */}
      <Sheet open={mobileOpen} onOpenChange={onMobileClose}>
        <SheetContent side="left" className="w-64 p-0 bg-[#063E66] border-none">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent onNavigate={onMobileClose} />
        </SheetContent>
      </Sheet>
    </>
  );
}
