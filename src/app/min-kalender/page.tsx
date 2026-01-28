"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { DynamicBackground } from "../components/DynamicBackground";
import { AnimatedCard } from "../components/AnimatedCard";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type PrivateEvent = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
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

function formatDateDisplay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function MinKalenderPage() {
  const [events, setEvents] = useState<PrivateEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const fetchEvents = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("private_events")
        .select("*")
        .gte("starts_at", startOfMonth.toISOString())
        .lte("starts_at", endOfMonth.toISOString())
        .order("starts_at");

      if (fetchError) throw fetchError;
      setEvents(data || []);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Kunne ikke hente dine aftaler. Prøv igen senere.");
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    
    fetchEvents();

    // Subscribe to realtime updates for private events
    const channel = supabase
      .channel("private-events-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "private_events" },
        (payload) => {
          console.log("[Realtime] Private events update received:", payload.eventType);
          fetchEvents();
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("[Realtime] Connected to private_events channel");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[Realtime] Private events channel error:", err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents]);

  const getEventsForDate = (date: Date): PrivateEvent[] => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((e) => e.starts_at.startsWith(dateStr));
  };

  const getDaysInMonth = (): (Date | null)[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of month
    const startPadding = (firstDay.getDay() + 6) % 7; // Monday = 0
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <DynamicBackground>
      <div className="min-h-full px-4 py-8 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">Min Kalender</h1>
            <p className="text-zinc-600">Dine personlige aftaler</p>
          </div>
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

        {/* Calendar Grid */}
        <AnimatedCard delay={0.15}>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Man", "Tirs", "Ons", "Tors", "Fre", "Lør", "Søn"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-zinc-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }

              const dateStr = date.toISOString().split("T")[0];
              const isToday = dateStr === today;
              const dayEvents = getEventsForDate(date);
              const hasEvents = dayEvents.length > 0;

              return (
                <div
                  key={dateStr}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative ${
                    isToday
                      ? "bg-blue-500 text-white font-bold"
                      : "text-zinc-700"
                  }`}
                >
                  {date.getDate()}
                  {hasEvents && (
                    <div
                      className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                        isToday ? "bg-white" : "bg-blue-500"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </AnimatedCard>

        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-6"
        >
          <h2 className="text-lg font-semibold text-zinc-800 mb-4">
            Kommende aftaler
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-white/30 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : events.length === 0 ? (
            <AnimatedCard>
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                <p className="text-zinc-600">Ingen aftaler denne måned</p>
                <p className="text-sm text-zinc-500 mt-1">
                  Kontakt personalet for at tilføje aftaler
                </p>
              </div>
            </AnimatedCard>
          ) : (
            <div className="space-y-3">
              {events.map((event, idx) => (
                <AnimatedCard
                  key={event.id}
                  delay={prefersReducedMotion ? 0 : idx * 0.05}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-800">
                        {event.title}
                      </h3>
                      <p className="text-sm text-zinc-600">
                        {formatDateDisplay(event.starts_at)}
                        {!event.all_day && ` kl. ${formatTime(event.starts_at)}`}
                      </p>
                      {event.description && (
                        <p className="text-sm text-zinc-500 mt-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DynamicBackground>
  );
}
