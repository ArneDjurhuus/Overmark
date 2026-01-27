"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  User,
  ChevronRight,
  LogOut,
  Calendar,
  Bell,
  Moon,
  Shield,
  AlertCircle,
  Settings,
} from "lucide-react";
import { isStaffOrAdmin } from "@/types/user";
import { DynamicBackground } from "../components/DynamicBackground";
import { AnimatedCard } from "../components/AnimatedCard";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  full_name: string | null;
  display_name: string | null;
  role: string;
  room_number: string | null;
};

function getRoleLabel(role: string): string {
  switch (role) {
    case "staff":
    case "personale":
      return "Personale";
    case "admin":
      return "Administrator";
    default:
      return "Beboer";
  }
}

function getRoleColor(role: string): string {
  switch (role) {
    case "staff":
    case "personale":
      return "bg-blue-100 text-blue-700";
    case "admin":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-emerald-100 text-emerald-700";
  }
}

export default function ProfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    async function loadProfile() {
      const supabase = createSupabaseBrowserClient();
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (fetchError) throw fetchError;
        setProfile(data);
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Kunne ikke hente din profil. Prøv igen senere.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // For residents, show "Værelse X", for staff show their name
  const displayName = profile?.role === 'resident' && profile?.room_number
    ? `Værelse ${profile.room_number}`
    : profile?.display_name || profile?.full_name || "Bruger";

  return (
    <DynamicBackground>
      <div className="min-h-full px-4 py-8 pb-28">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-zinc-800">Profil</h1>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-red-50/80 border border-red-200/50 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-32 bg-white/30 rounded-3xl animate-pulse" />
            <div className="h-48 bg-white/30 rounded-3xl animate-pulse" />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Card */}
            <AnimatedCard delay={0.1}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {profile.room_number || displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-zinc-800">
                    {displayName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleColor(
                        profile.role
                      )}`}
                    >
                      {getRoleLabel(profile.role)}
                    </span>
                  </div>
                </div>
              </div>
            </AnimatedCard>

            {/* Quick Links */}
            <AnimatedCard delay={0.2}>
              <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-4">
                Genveje
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push("/min-kalender")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="flex-1 text-left font-medium text-zinc-800">
                    Min kalender
                  </span>
                  <ChevronRight className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
            </AnimatedCard>

            {/* Admin Panel Link - Only visible for staff/admin */}
            {isStaffOrAdmin(profile.role) && (
              <AnimatedCard delay={0.25}>
                <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-4">
                  Administration
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push("/admin")}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <span className="flex-1 text-left font-medium text-purple-800">
                      Åbn admin panel
                    </span>
                    <ChevronRight className="w-5 h-5 text-purple-400" />
                  </button>
                </div>
              </AnimatedCard>
            )}

            {/* Settings */}
            <AnimatedCard delay={0.3}>
              <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-4">
                Indstillinger
              </h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="flex-1 text-left font-medium text-zinc-800">
                    Notifikationer
                  </span>
                  <ChevronRight className="w-5 h-5 text-zinc-400" />
                </button>

                <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Moon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="flex-1 text-left font-medium text-zinc-800">
                    Udseende
                  </span>
                  <ChevronRight className="w-5 h-5 text-zinc-400" />
                </button>

                <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-zinc-600" />
                  </div>
                  <span className="flex-1 text-left font-medium text-zinc-800">
                    Privatlivspolitik
                  </span>
                  <ChevronRight className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
            </AnimatedCard>

            {/* Logout */}
            <AnimatedCard delay={0.4}>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-red-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-600" />
                </div>
                <span className="flex-1 text-left font-medium text-red-600">
                  Log ud
                </span>
              </button>
            </AnimatedCard>
          </div>
        ) : (
          <AnimatedCard>
            <div className="text-center py-8">
              <User className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-zinc-700 mb-2">
                Ikke logget ind
              </h3>
              <button
                onClick={() => router.push("/login")}
                className="mt-4 px-6 py-3 bg-blue-500 text-white font-medium rounded-xl"
              >
                Log ind
              </button>
            </div>
          </AnimatedCard>
        )}
      </div>
    </DynamicBackground>
  );
}
