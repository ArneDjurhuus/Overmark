"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Leaf, AlertTriangle, AlertCircle } from "lucide-react";
import { DynamicBackground } from "../components/DynamicBackground";
import { AnimatedCard } from "../components/AnimatedCard";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Meal = {
  id: string;
  date: string;
  title: string;
  description: string | null;
  vegetarian_option: string | null;
  allergens: string[] | null;
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

export default function MadplanPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const weekDates = getWeekDates(weekOffset);
  const startDate = formatDate(weekDates[0]);
  const endDate = formatDate(weekDates[6]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function fetchMeals() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("meals")
          .select("*")
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date");

        if (fetchError) throw fetchError;
        setMeals(data || []);
      } catch (err) {
        console.error("Error fetching meals:", err);
        setError("Kunne ikke hente madplanen. Prøv igen senere.");
      } finally {
        setLoading(false);
      }
    }

    fetchMeals();

    // Subscribe to realtime updates with status logging
    const channel = supabase
      .channel("meals-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meals" },
        (payload) => {
          console.log("[Realtime] Meals update received:", payload.eventType);
          fetchMeals();
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("[Realtime] Connected to meals channel");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[Realtime] Meals channel error:", err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [startDate, endDate]);

  const getMealForDate = (date: Date): Meal | undefined => {
    const dateStr = formatDate(date);
    return meals.find((m) => m.date === dateStr);
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
          <h1 className="text-2xl font-bold text-zinc-800">Madplan</h1>
          <p className="text-zinc-600">Se ugens måltider</p>
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
            <span className="font-semibold text-zinc-800">
              {weekOffset === 0
                ? "Denne uge"
                : weekOffset === 1
                ? "Næste uge"
                : weekOffset === -1
                ? "Sidste uge"
                : `Uge ${weekOffset > 0 ? "+" : ""}${weekOffset}`}
            </span>
            <p className="text-sm text-zinc-600">
              {formatDisplayDate(weekDates[0])} - {formatDisplayDate(weekDates[6])}
            </p>
          </div>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="min-w-12 min-h-12 p-3 rounded-xl bg-white/50 hover:bg-white/70 transition-colors flex items-center justify-center"
            aria-label="Næste uge"
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

        {/* Meals Grid */}
        <div className="space-y-4">
          {weekDates.map((date, index) => {
            const meal = getMealForDate(date);
            const isToday = formatDate(date) === today;
            const dayName = weekdayNames[date.getDay()];

            return (
              <AnimatedCard
                key={formatDate(date)}
                delay={prefersReducedMotion ? 0 : index * 0.05}
                accentColor={
                  isToday
                    ? "from-amber-100/70 to-orange-50/50"
                    : "from-white/60 to-white/40"
                }
              >
                <div className="flex items-start gap-4">
                  {/* Date badge */}
                  <div
                    className={`shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center ${
                      isToday
                        ? "bg-amber-500 text-white"
                        : "bg-white/50 text-zinc-700"
                    }`}
                  >
                    <span className="text-xs font-medium uppercase">
                      {dayName.slice(0, 3)}
                    </span>
                    <span className="text-xl font-bold">{date.getDate()}</span>
                  </div>

                  {/* Meal info */}
                  <div className="flex-1 min-w-0">
                    {loading ? (
                      <div className="space-y-2">
                        <div className="h-5 w-32 bg-gray-200/50 rounded animate-pulse" />
                        <div className="h-4 w-48 bg-gray-200/50 rounded animate-pulse" />
                      </div>
                    ) : meal ? (
                      <>
                        <h3 className="font-semibold text-zinc-800 text-lg">
                          {meal.title}
                        </h3>
                        {meal.description && (
                          <p className="text-zinc-600 text-sm mt-1">
                            {meal.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {meal.vegetarian_option && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100/70 text-green-700 rounded-lg text-xs">
                              <Leaf className="w-3 h-3" />
                              {meal.vegetarian_option}
                            </span>
                          )}
                          {meal.allergens && meal.allergens.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100/70 text-orange-700 rounded-lg text-xs">
                              <AlertTriangle className="w-3 h-3" />
                              {meal.allergens.join(", ")}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-zinc-500 italic">
                        Ingen mad planlagt endnu
                      </p>
                    )}
                  </div>
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      </div>
    </DynamicBackground>
  );
}
