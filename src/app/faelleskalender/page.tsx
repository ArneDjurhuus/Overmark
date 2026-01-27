"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Users,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Tag,
  AlertCircle,
} from "lucide-react";
import { DynamicBackground } from "../components/DynamicBackground";
import { AnimatedCard } from "../components/AnimatedCard";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Activity = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  category: string | null;
  requires_signup: boolean;
  max_participants: number | null;
};

const categoryColors: Record<string, string> = {
  sport: "bg-green-100 text-green-700",
  social: "bg-blue-100 text-blue-700",
  creative: "bg-purple-100 text-purple-700",
  health: "bg-rose-100 text-rose-700",
  education: "bg-amber-100 text-amber-700",
  other: "bg-zinc-100 text-zinc-700",
};

const categoryLabels: Record<string, string> = {
  sport: "Sport",
  social: "Socialt",
  creative: "Kreativt",
  health: "Sundhed",
  education: "Uddannelse",
  other: "Andet",
};

const monthNames = [
  "Januar", "Februar", "Marts", "April", "Maj", "Juni",
  "Juli", "August", "September", "Oktober", "November", "December",
];

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const dateOnly = date.toISOString().split("T")[0];
  const todayOnly = today.toISOString().split("T")[0];
  const tomorrowOnly = tomorrow.toISOString().split("T")[0];

  if (dateOnly === todayOnly) return "I dag";
  if (dateOnly === tomorrowOnly) return "I morgen";

  return date.toLocaleDateString("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function FaelleskalenderPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function fetchActivities() {
      setLoading(true);
      setError(null);
      const startOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      );
      const endOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      try {
        const { data, error: fetchError } = await supabase
          .from("activities")
          .select("*")
          .gte("starts_at", startOfMonth.toISOString())
          .lte("starts_at", endOfMonth.toISOString())
          .order("starts_at");

        if (fetchError) throw fetchError;
        setActivities(data || []);
      } catch (err) {
        console.error("Error fetching activities:", err);
        setError("Kunne ikke hente aktiviteter. Prøv igen senere.");
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("activities-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities" },
        () => fetchActivities()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentMonth]);

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activity[]> = {};
    activities.forEach((activity) => {
      const dateKey = activity.starts_at.split("T")[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });
    return groups;
  }, [activities]);

  const sortedDates = Object.keys(groupedActivities).sort();

  return (
    <DynamicBackground>
      <div className="min-h-full px-4 py-8 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-zinc-800">Fælleskalender</h1>
          <p className="text-zinc-600">Aktiviteter for alle beboere</p>
        </motion.div>

        {/* Month Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-6 p-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/30"
        >
          <button
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
              )
            }
            className="min-w-12 min-h-12 p-3 rounded-xl bg-white/50 hover:bg-white/70 transition-colors flex items-center justify-center"
            aria-label="Forrige måned"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-700" />
          </button>
          <span className="font-semibold text-zinc-800 text-lg">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
              )
            }
            className="min-w-12 min-h-12 p-3 rounded-xl bg-white/50 hover:bg-white/70 transition-colors flex items-center justify-center"
            aria-label="Næste måned"
          >
            <ChevronRight className="w-5 h-5 text-zinc-700" />
          </button>
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

        {/* Activities List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-white/30 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : sortedDates.length === 0 ? (
          <AnimatedCard>
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-zinc-700 mb-2">
                Ingen aktiviteter denne måned
              </h3>
              <p className="text-zinc-500">
                Tjek tilbage senere for nye begivenheder
              </p>
            </div>
          </AnimatedCard>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateKey, groupIdx) => (
              <div key={dateKey}>
                {/* Date Header */}
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: prefersReducedMotion ? 0 : groupIdx * 0.05 }}
                  className="text-lg font-semibold text-zinc-800 mb-3 capitalize"
                >
                  {formatDateGroup(dateKey + "T12:00:00")}
                </motion.h2>

                {/* Activities for this date */}
                <div className="space-y-3">
                  {groupedActivities[dateKey].map((activity, idx) => (
                    <AnimatedCard
                      key={activity.id}
                      delay={
                        prefersReducedMotion ? 0 : groupIdx * 0.05 + idx * 0.03
                      }
                    >
                      <div className="flex gap-4">
                        {/* Time column */}
                        <div className="shrink-0 w-16 text-center">
                          <div className="text-lg font-bold text-zinc-800">
                            {formatTime(activity.starts_at)}
                          </div>
                          {activity.ends_at && (
                            <div className="text-xs text-zinc-500">
                              – {formatTime(activity.ends_at)}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-zinc-800 text-lg">
                            {activity.title}
                          </h3>

                          {activity.description && (
                            <p className="text-zinc-600 text-sm mt-1">
                              {activity.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 mt-3">
                            {activity.category && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                                  categoryColors[activity.category] ||
                                  categoryColors.other
                                }`}
                              >
                                <Tag className="w-3 h-3" />
                                {categoryLabels[activity.category] ||
                                  activity.category}
                              </span>
                            )}

                            {activity.location && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 text-zinc-700 rounded-lg text-xs">
                                <MapPin className="w-3 h-3" />
                                {activity.location}
                              </span>
                            )}

                            {activity.max_participants && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 text-zinc-700 rounded-lg text-xs">
                                <Users className="w-3 h-3" />
                                Maks {activity.max_participants} deltagere
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </AnimatedCard>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DynamicBackground>
  );
}
