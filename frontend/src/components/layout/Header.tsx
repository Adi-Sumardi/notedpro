"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Bell,
  LogOut,
  LayoutDashboard,
  FileText,
  CheckSquare,
  Users,
  ClipboardPenLine,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/hooks/useNotifications";
import type { Notification } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function NotificationBell() {
  const { data: notifData } = useNotifications();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notifications: Notification[] = notifData?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-5 w-5 text-[#063E66]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-80 rounded-lg border bg-white shadow-lg z-50">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs text-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    if (!notification.read_at) {
                      markAsReadMutation.mutate(notification.id);
                    }
                  }}
                  className={`cursor-pointer border-b px-4 py-3 transition-colors hover:bg-[#BEDBED]/20 ${
                    !notification.read_at ? "bg-[#BEDBED]/30" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notification.read_at && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.data.title}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { user, hasRole, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.some((role) => hasRole(role));
  });

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Logo + Desktop Nav */}
            <div className="flex items-center gap-6">
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
                <img src="/logo.png" alt="Simonik" className="h-8 w-8 rounded-lg" />
                <span className="text-lg font-bold text-[#063E66] hidden sm:inline">Simonik</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1">
                {filteredNavItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-[#063E66] text-white"
                          : "text-[#063E66]/70 hover:bg-[#063E66]/10 hover:text-[#063E66]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Notifications + User + Mobile Hamburger */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="sm:size-auto sm:px-2 hover:bg-gray-100"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-[#BEDBED] text-[#063E66] text-xs font-semibold">
                        {user ? getInitials(user.name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-medium text-[#063E66] leading-tight">
                        {user?.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-4 capitalize"
                      >
                        {user?.roles?.[0]}
                      </Badge>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-sm text-red-600 focus:text-red-600 cursor-pointer"
                    onClick={async () => {
                      await logout();
                      window.location.href = "/login";
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Hamburger */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-[#063E66]"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-64 p-0 bg-[#063E66] border-none">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
              <img src="/logo.png" alt="Simonik" className="h-8 w-8 rounded-lg" />
              <span className="text-lg font-bold text-white">Simonik</span>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {filteredNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
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
            {user && (
              <div className="border-t border-white/10 px-6 py-4">
                <p className="text-sm font-medium text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-[#BEDBED] capitalize">
                  {user.roles?.[0]}
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
