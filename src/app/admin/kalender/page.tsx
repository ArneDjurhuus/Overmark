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
  MapPin,
  Users,
} from "lucide-react";
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

type ActivityFormData = {
  title: string;
  description: string;
  location: string;
  starts_at: string;
  ends_at: string;
  category: string;
  requires_signup: boolean;
  max_participants: string;
};

const emptyForm: ActivityFormData = {
  title: "",
  description: "",
  location: "",
  starts_at: "",
  ends_at: "",
  category: "other",
  requires_signup: false,
  max_participants: "",
};

const categoryOptions = [
  { value: "sport", label: "Sport" },
  { value: "social", label: "Socialt" },
  { value: "creative", label: "Kreativt" },
  { value: "health", label: "Sundhed" },
  { value: "education", label: "Uddannelse" },
  { value: "other", label: "Andet" },
];

const categoryColors: Record<string, string> = {
  sport: "bg-green-100 text-green-700",
  social: "bg-blue-100 text-blue-700",
  creative: "bg-purple-100 text-purple-700",
  health: "bg-rose-100 text-rose-700",
  education: "bg-amber-100 text-amber-700",
  other: "bg-zinc-100 text-zinc-700",
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

function formatDatetime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("da-DK", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toLocalDatetimeString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default function AdminKalenderPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState<ActivityFormData>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
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
      setError("Kunne ikke hente aktiviteter.");
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const openCreateModal = () => {
    setEditingActivity(null);
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    setFormData({
      ...emptyForm,
      starts_at: toLocalDatetimeString(now),
    });
    setShowModal(true);
  };

  const openEditModal = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      title: activity.title,
      description: activity.description || "",
      location: activity.location || "",
      starts_at: toLocalDatetimeString(new Date(activity.starts_at)),
      ends_at: activity.ends_at ? toLocalDatetimeString(new Date(activity.ends_at)) : "",
      category: activity.category || "other",
      requires_signup: activity.requires_signup,
      max_participants: activity.max_participants?.toString() || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const supabase = createSupabaseBrowserClient();
    setSaving(true);
    setError(null);

    const activityData = {
      title: formData.title,
      description: formData.description || null,
      location: formData.location || null,
      starts_at: new Date(formData.starts_at).toISOString(),
      ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
      category: formData.category || null,
      requires_signup: formData.requires_signup,
      max_participants: formData.max_participants
        ? parseInt(formData.max_participants)
        : null,
    };

    try {
      if (editingActivity) {
        const { error } = await supabase
          .from("activities")
          .update(activityData)
          .eq("id", editingActivity.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("activities").insert(activityData);
        if (error) throw error;
      }

      setShowModal(false);
      fetchActivities();
    } catch (err) {
      console.error("Error saving activity:", err);
      setError("Kunne ikke gemme aktiviteten. Prøv igen.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (activity: Activity) => {
    if (!confirm(`Er du sikker på, at du vil slette "${activity.title}"?`)) return;

    const supabase = createSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", activity.id);
      if (error) throw error;
      fetchActivities();
    } catch (err) {
      console.error("Error deleting activity:", err);
      setError("Kunne ikke slette aktiviteten.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Aktiviteter</h1>
          <p className="text-slate-600 mt-1">Administrer husets aktiviteter</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Ny aktivitet</span>
        </button>
      </motion.div>

      {/* Month Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between mb-6 p-4 bg-white rounded-2xl border border-slate-200"
      >
        <button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
            )
          }
          className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
          aria-label="Forrige måned"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <span className="font-semibold text-slate-800">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
            )
          }
          className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
          aria-label="Næste måned"
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

      {/* Activities List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500">Ingen aktiviteter denne måned</p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors"
            >
              Opret den første aktivitet
            </button>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-slate-800">{activity.title}</h3>
                    {activity.category && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          categoryColors[activity.category] || categoryColors.other
                        }`}
                      >
                        {categoryOptions.find((c) => c.value === activity.category)?.label ||
                          activity.category}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 mb-2">
                    {formatDatetime(activity.starts_at)}
                    {activity.ends_at && ` – ${formatTime(activity.ends_at)}`}
                  </p>

                  {activity.description && (
                    <p className="text-sm text-slate-600 mb-2">{activity.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    {activity.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {activity.location}
                      </span>
                    )}
                    {activity.requires_signup && (
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Tilmelding påkrævet
                        {activity.max_participants && ` (max ${activity.max_participants})`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => openEditModal(activity)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                    title="Rediger"
                  >
                    <Pencil className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(activity)}
                    className="p-2 rounded-lg bg-red-100 hover:bg-red-200 transition-colors"
                    title="Slet"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))
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
                {editingActivity ? "Rediger aktivitet" : "Ny aktivitet"}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Titel *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="F.eks. Filmaften"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="starts_at" className="block text-sm font-medium text-slate-700 mb-1">
                    Starter *
                  </label>
                  <input
                    id="starts_at"
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) =>
                      setFormData({ ...formData, starts_at: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label htmlFor="ends_at" className="block text-sm font-medium text-slate-700 mb-1">
                    Slutter
                  </label>
                  <input
                    id="ends_at"
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Beskrivelse
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Valgfri beskrivelse..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sted
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="F.eks. Fællessalen"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  aria-label="Kategori"
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requires_signup}
                    onChange={(e) =>
                      setFormData({ ...formData, requires_signup: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-sm text-slate-700">Tilmelding påkrævet</span>
                </label>
              </div>

              {formData.requires_signup && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Max antal deltagere
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_participants}
                    onChange={(e) =>
                      setFormData({ ...formData, max_participants: e.target.value })
                    }
                    placeholder="Lad stå tom for ubegrænset"
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              )}

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
                disabled={saving || !formData.title.trim() || !formData.starts_at}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
