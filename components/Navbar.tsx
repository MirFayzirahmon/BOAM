"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { setApiUserEmail } from "@/lib/api";
import { useRole } from "@/components/RoleContext";
import { useTheme } from "@/components/ThemeContext";
import {
  LayoutDashboard,
  Package,
  Users,
  ClipboardList,
  BarChart3,
  Menu,
  X,
  FileText,
  Shield,
  User,
  CircleUserRound,
  Moon,
  Sun,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role, email, isAdmin } = useRole();
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  // Sync email to API layer for X-User-Email header
  useEffect(() => {
    setApiUserEmail(email);
  }, [email]);

  const adminNavItems = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/assets", label: t("nav.assets"), icon: Package },
    { href: "/employees", label: t("nav.employees"), icon: Users },
    { href: "/requests", label: t("nav.requests"), icon: FileText },
    { href: "/audit", label: t("nav.audit"), icon: ClipboardList },
    { href: "/analytics", label: t("nav.analytics"), icon: BarChart3 },
    { href: "/profile", label: t("nav.profile"), icon: CircleUserRound },
  ];

  const employeeNavItems = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/assets", label: t("nav.assets"), icon: Package },
    { href: "/requests", label: t("nav.myRequests"), icon: FileText },
    { href: "/profile", label: t("nav.profile"), icon: CircleUserRound },
  ];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Package className="h-6 w-6 text-gold-400" />
          <span className="text-lg font-bold">
            <span className="text-gold-400">Asset</span>Track
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <LanguageSwitcher />
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gold-400/10 text-gold-400"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
              );
            })}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {/* Role badge */}
          {role && (
            <span
              className={`ml-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isAdmin
                  ? "bg-red-500/10 text-red-400"
                  : "bg-blue-500/10 text-blue-400"
              }`}
            >
              {isAdmin ? (
                <Shield className="h-3 w-3" />
              ) : (
                <User className="h-3 w-3" />
              )}
              {role}
            </span>
          )}
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-border/40 bg-background p-4 md:hidden">
          <div className="flex flex-col gap-2">
            <div className="pb-2">
              <LanguageSwitcher />
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gold-400/10 text-gold-400"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            {role && (
              <span
                className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isAdmin
                    ? "bg-red-500/10 text-red-400"
                    : "bg-blue-500/10 text-blue-400"
                }`}
              >
                {isAdmin ? (
                  <Shield className="h-3 w-3" />
                ) : (
                  <User className="h-3 w-3" />
                )}
                {role}
              </span>
            )}
            <Button variant="ghost" className="justify-start gap-2" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              Switch to {theme === "dark" ? "light" : "dark"} mode
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
