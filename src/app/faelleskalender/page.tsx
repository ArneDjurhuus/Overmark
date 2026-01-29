"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Users,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Tag,
  AlertCircle,
  Calendar,
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

const weekdayNames = [
  "Søndag",
  "Mandag",
  "Tirsdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lørdag",
];

function getWeekDates(weekOffset: number = 0): Date[] {
  const today = new Date();
  const currentDay = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - currentDay + 1 + weekOffset * 7);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export default function FaelleskalenderPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const weekDates = getWeekDates(weekOffset);
  const startDate = formatDate(weekDates[0]);
  const endDate = formatDate(weekDates[6]);
  const weekNumber = getWeekNumber(weekDates[0]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function fetchActivities() {
      setLoading(true);
      setError(null);
      
      const startDateTime = new Date(startDate + "T00:00:00");
      const endDateTime = new Date(endDate + "T23:59:59");

      try {
        const { data, error: fetchError } = await supabase
          .from("activities")
          .select("*")
          .gte("starts_at", startDateTime.toISOString())
          .lte("starts_at", endDateTime.toISOString())
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

    const channel = supabase
      .channel("activities-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities" },
        (payload) => {
          console.log("[Realtime] Activities update received:", payload.eventType);
          fetchActivities();
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("[Realtime] Connected to activities channel");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[Realtime] Activities channel error:", err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [startDate, endDate]);

  const getActivitiesForDate = (date: Date): Activity[] => {
    const dateStr = formatDate(date);
    return activities.filter((a) => a.starts_at.startsWith(dateStr));
  };

  const today = formatDate(new Date());

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

        {/* Week Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-6 p-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/30"
        >
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="min-w-12 min-h-12 p-3 rounded-xl bg-white/50 hover:bg-white/70 transition-colors flex items-center justify-center"
            aria-label="Forrige uge"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-700" />
          </button>
          <div className="text-center">
            <span className="font-semibold text-zinc-800 text-lg block">
              Uge {weekNumber}
            </span>
            <span className="text-sm text-zinc-600">
              {formatDisplayDate(weekDates[0])} – {formatDisplayDate(weekDates[6])}
            </span>
          </div>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="min-w-12 min-h-12 p-3 rounded-xl bg-white/50 hover:bg-white/70 transition-colors flex items-center justify-center"
            aria-label="Næste uge"
          >
            <ChevronRight className="w-5 h-5 text-zinc-700" />
          </button>
        </motion.div>

        {/* Today button */}
        {weekOffset !== 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex justify-center"
          >
            <button
              onClick={() => setWeekOffset(0)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Gå til denne uge
            </button>
          </motion.div>
        )}

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

        {/* Weekly Activities */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-24 bg-white/30 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {weekDates.map((date, idx) => {
              const dateStr = formatDate(date);
              const isToday = dateStr === today;
              const dayActivities = getActivitiesForDate(date);
              const dayOfWeek = date.getDay();

              return (
                <AnimatedCard
                  key={dateStr}
                  delay={prefersReducedMotion ? 0 : idx * 0.05}
                  className={isToday ? "ring-2 ring-blue-400 ring-offset-2" : ""}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${
                          isToday ? "bg-blue-500 text-white" : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        <span className="text-xs font-medium uppercase">
                          {weekdayNames[dayOfWeek].slice(0, 3)}
                        </span>
                        <span className="text-lg font-bold leading-none">
                          {date.getDate()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-800">{weekdayNames[dayOfWeek]}</h3>
                        <p className="text-sm text-zinc-500">{formatDisplayDate(date)}</p>
                      </div>
                    </div>
                    {isToday && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        I dag
                      </span>
                    )}
                  </div>

                  {/* Activities for this day */}
                  {dayActivities.length === 0 ? (
                    <p className="text-zinc-400 text-sm italic ml-15">Ingen aktiviteter</p>
                  ) : (
                    <div className="space-y-3 ml-15">
                      {dayActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="p-3 rounded-xl bg-white/50 border border-white/30"
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-sm font-medium text-zinc-600 w-14 shrink-0">
                              {formatTime(activity.starts_at)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-zinc-800">{activity.title}</h4>
                              {activity.description && (
                                <p className="text-sm text-zinc-600 mt-1">{activity.description}</p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {activity.category && (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${
                                      categoryColors[activity.category] || categoryColors.other
                                    }`}
                                  >
                                    <Tag className="w-3 h-3" />
                                    {categoryLabels[activity.category] || activity.category}
                                  </span>
                                )}
                                {activity.location && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs">
                                    <MapPin className="w-3 h-3" />
                                    {activity.location}
                                  </span>
                                )}
                                {activity.max_participants && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs">
                                    <Users className="w-3 h-3" />
                                    Maks {activity.max_participants}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </AnimatedCard>
              );
            })}
          </div>
        )}
      </div>
    </DynamicBackground>
  );
}
