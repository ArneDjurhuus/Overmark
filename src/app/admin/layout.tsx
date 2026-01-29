"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  LayoutDashboard,
  Utensils,
  Calendar,
  CalendarCheck,
  Users,
  QrCode,
  LogOut,
  ChevronLeft,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const adminNavItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/madplan", icon: Utensils, label: "Madplan" },
  { href: "/admin/kalender", icon: Calendar, label: "Aktiviteter" },
  { href: "/admin/aftaler", icon: CalendarCheck, label: "Beboer Aftaler" },
  { href: "/admin/brugere", icon: Users, label: "Brugere" },
  { href: "/admin/qr-koder", icon: QrCode, label: "QR-koder" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  
  const [authorized, setAuthorized] = useState(isLoginPage);
  const [loading, setLoading] = useState(!isLoginPage);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Skip auth check on login page
    if (isLoginPage) {
      return;
    }

    async function checkAuth() {
      const supabase = createSupabaseBrowserClient();
      
      // Check Supabase session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/admin/login");
        return;
      }

      // Check user role from profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, display_name, full_name")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("Profile error:", profileError);
        router.push("/admin/login");
        return;
      }

      const allowedRoles = ["admin", "staff", "personale"];
      if (!allowedRoles.includes(profile.role)) {
        router.push("/admin/login");
        return;
      }

      setUserName(profile.display_name || profile.full_name || user.email?.split("@")[0] || "Admin");
      setAuthorized(true);
      setLoading(false);
    }

    checkAuth();
  }, [router, isLoginPage]);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  // For login page, just render children without layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Kontrollerer adgang...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-slate-800">Admin</span>
          </div>
          <Link href="/" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: sidebarOpen ? 0 : "-100%" }}
        className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-white border-r border-slate-200 shadow-xl"
      >
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{userName}</p>
              <p className="text-sm text-slate-500">Administrator</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-purple-100 text-purple-700"
                    : "hover:bg-slate-100 text-slate-600"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors mb-2"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Tilbage til app</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log ud</span>
          </button>
        </div>
      </motion.aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="font-bold text-slate-800">Overmarksgården</h1>
              <p className="text-sm text-slate-500">Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{userName}</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-purple-100 text-purple-700"
                    : "hover:bg-slate-100 text-slate-600"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors mb-2"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Tilbage til app</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log ud</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
