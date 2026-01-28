"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  Leaf,
  AlertTriangle,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Meal = {
  id: string;
  date: string;
  title: string;
  description: string | null;
  vegetarian_option: string | null;
  allergens: string[] | null;
};

type MealFormData = {
  date: string;
  title: string;
  description: string;
  vegetarian_option: string;
  allergens: string;
};

const emptyForm: MealFormData = {
  date: "",
  title: "",
  description: "",
  vegetarian_option: "",
  allergens: "",
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

export default function AdminMadplanPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [formData, setFormData] = useState<MealFormData>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const weekDates = getWeekDates(weekOffset);
  const startDate = formatDate(weekDates[0]);
  const endDate = formatDate(weekDates[6]);

  const fetchMeals = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
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
      setError("Kunne ikke hente madplanen.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const getMealForDate = (date: Date): Meal | undefined => {
    const dateStr = formatDate(date);
    return meals.find((m) => m.date === dateStr);
  };

  const openCreateModal = (date?: Date) => {
    setEditingMeal(null);
    setFormData({
      ...emptyForm,
      date: date ? formatDate(date) : formatDate(new Date()),
    });
    setShowModal(true);
  };

  const openEditModal = (meal: Meal) => {
    setEditingMeal(meal);
    setFormData({
      date: meal.date,
      title: meal.title,
      description: meal.description || "",
      vegetarian_option: meal.vegetarian_option || "",
      allergens: meal.allergens?.join(", ") || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const supabase = createSupabaseBrowserClient();
    setSaving(true);
    setError(null);

    const allergenArray = formData.allergens
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    const mealData = {
      date: formData.date,
      title: formData.title,
      description: formData.description || null,
      vegetarian_option: formData.vegetarian_option || null,
      allergens: allergenArray.length > 0 ? allergenArray : null,
    };

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Du skal være logget ind for at gemme måltider.");
        setSaving(false);
        return;
      }

      if (editingMeal) {
        const { error } = await supabase
          .from("meals")
          .update(mealData)
          .eq("id", editingMeal.id);

        if (error) {
          console.error("Supabase update error:", error.message, error.code, error.details);
          throw new Error(error.message || "Kunne ikke opdatere måltid");
        }
      } else {
        const { error } = await supabase.from("meals").insert(mealData);
        if (error) {
          console.error("Supabase insert error:", error.message, error.code, error.details);
          throw new Error(error.message || "Kunne ikke oprette måltid");
        }
      }

      setShowModal(false);
      fetchMeals();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ukendt fejl";
      console.error("Error saving meal:", message);
      setError(`Kunne ikke gemme måltidet: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (meal: Meal) => {
    if (!confirm(`Er du sikker på, at du vil slette "${meal.title}"?`)) return;

    const supabase = createSupabaseBrowserClient();
    try {
      const { error } = await supabase.from("meals").delete().eq("id", meal.id);
      if (error) throw error;
      fetchMeals();
    } catch (err) {
      console.error("Error deleting meal:", err);
      setError("Kunne ikke slette måltidet.");
    }
  };

  const today = formatDate(new Date());

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Madplan</h1>
          <p className="text-slate-600 mt-1">Administrer ugens måltider</p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Tilføj måltid</span>
        </button>
      </motion.div>

      {/* Week Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between mb-6 p-4 bg-white rounded-2xl border border-slate-200"
      >
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
          aria-label="Forrige uge"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="text-center">
          <span className="font-semibold text-slate-800">
            {weekOffset === 0
              ? "Denne uge"
              : weekOffset === 1
              ? "Næste uge"
              : weekOffset === -1
              ? "Sidste uge"
              : `Uge ${weekOffset > 0 ? "+" : ""}${weekOffset}`}
          </span>
          <p className="text-sm text-slate-600">
            {formatDisplayDate(weekDates[0])} - {formatDisplayDate(weekDates[6])}
          </p>
        </div>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
          aria-label="Næste uge"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>
      </motion.div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Week Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-4"
      >
        {loading ? (
          <div className="space-y-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          weekDates.map((date) => {
            const meal = getMealForDate(date);
            const dateStr = formatDate(date);
            const isToday = dateStr === today;

            return (
              <div
                key={dateStr}
                className={`bg-white rounded-xl border p-4 ${
                  isToday ? "border-orange-300 ring-2 ring-orange-100" : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-semibold ${isToday ? "text-orange-600" : "text-slate-800"}`}>
                        {weekdayNames[date.getDay()]}
                      </span>
                      <span className="text-sm text-slate-500">
                        {formatDisplayDate(date)}
                      </span>
                      {isToday && (
                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                          I dag
                        </span>
                      )}
                    </div>

                    {meal ? (
                      <div>
                        <h3 className="font-medium text-slate-800">{meal.title}</h3>
                        {meal.description && (
                          <p className="text-sm text-slate-600 mt-1">{meal.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {meal.vegetarian_option && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                              <Leaf className="w-3 h-3" />
                              {meal.vegetarian_option}
                            </span>
                          )}
                          {meal.allergens && meal.allergens.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              {meal.allergens.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">Intet måltid registreret</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {meal ? (
                      <>
                        <button
                          onClick={() => openEditModal(meal)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                          title="Rediger"
                        >
                          <Pencil className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(meal)}
                          className="p-2 rounded-lg bg-red-100 hover:bg-red-200 transition-colors"
                          title="Slet"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => openCreateModal(date)}
                        className="p-2 rounded-lg bg-orange-100 hover:bg-orange-200 transition-colors"
                        title="Tilføj måltid"
                      >
                        <Plus className="w-4 h-4 text-orange-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </motion.div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                {editingMeal ? "Rediger måltid" : "Tilføj måltid"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Luk"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="meal-date" className="block text-sm font-medium text-slate-700 mb-1">
                  Dato
                </label>
                <input
                  id="meal-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Måltid *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="F.eks. Lasagne"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Beskrivelse
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Valgfri beskrivelse..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Vegetarisk alternativ
                </label>
                <input
                  type="text"
                  value={formData.vegetarian_option}
                  onChange={(e) =>
                    setFormData({ ...formData, vegetarian_option: e.target.value })
                  }
                  placeholder="F.eks. Grøntsagslasagne"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Allergener (kommasepareret)
                </label>
                <input
                  type="text"
                  value={formData.allergens}
                  onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                  placeholder="F.eks. Gluten, Mælk"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Annuller
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.title.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? "Gemmer..." : "Gem"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
