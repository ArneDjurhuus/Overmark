"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Utensils, Calendar, Users, Clock } from "lucide-react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Stats = {
  totalMeals: number;
  totalActivities: number;
  totalUsers: number;
  upcomingActivities: number;
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalMeals: 0,
    totalActivities: 0,
    totalUsers: 0,
    upcomingActivities: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createSupabaseBrowserClient();
      const now = new Date().toISOString();

      try {
        const [mealsRes, activitiesRes, usersRes, upcomingRes] = await Promise.all([
          supabase.from("meals").select("id", { count: "exact", head: true }),
          supabase.from("activities").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("activities").select("id", { count: "exact", head: true }).gte("starts_at", now),
        ]);

        setStats({
          totalMeals: mealsRes.count || 0,
          totalActivities: activitiesRes.count || 0,
          totalUsers: usersRes.count || 0,
          upcomingActivities: upcomingRes.count || 0,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Måltider registreret",
      value: stats.totalMeals,
      icon: Utensils,
      color: "from-orange-500 to-amber-500",
      href: "/admin/madplan",
    },
    {
      label: "Aktiviteter total",
      value: stats.totalActivities,
      icon: Calendar,
      color: "from-purple-500 to-violet-500",
      href: "/admin/kalender",
    },
    {
      label: "Kommende aktiviteter",
      value: stats.upcomingActivities,
      icon: Clock,
      color: "from-blue-500 to-cyan-500",
      href: "/admin/kalender",
    },
    {
      label: "Brugere",
      value: stats.totalUsers,
      icon: Users,
      color: "from-emerald-500 to-teal-500",
      href: "/admin/brugere",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Velkommen til administrationspanelet
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8"
      >
        {statCards.map((stat) => (
          <motion.div key={stat.label} variants={item}>
            <Link href={stat.href}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all">
                <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${stat.color} flex items-center justify-center mb-4`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">
                  {loading ? (
                    <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
                  ) : (
                    stat.value
                  )}
                </div>
                <p className="text-sm text-slate-600">{stat.label}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
      >
        <h2 className="text-xl font-semibold text-slate-800 mb-4">
          Hurtige handlinger
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/madplan"
            className="flex items-center gap-4 p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-slate-800">Administrer madplan</p>
              <p className="text-sm text-slate-600">Tilføj eller rediger måltider</p>
            </div>
          </Link>

          <Link
            href="/admin/kalender"
            className="flex items-center gap-4 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-slate-800">Administrer aktiviteter</p>
              <p className="text-sm text-slate-600">Opret eller rediger events</p>
            </div>
          </Link>

          <Link
            href="/admin/brugere"
            className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-slate-800">Administrer brugere</p>
              <p className="text-sm text-slate-600">Se og rediger brugere</p>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* System Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 text-center text-sm text-slate-500"
      >
        <p>Overmarksgården Administration v1.0</p>
      </motion.div>
    </div>
  );
}
