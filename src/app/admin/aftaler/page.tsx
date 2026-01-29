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
  Calendar,
  User,
  Search,
  Filter,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Profile = {
  id: string;
  full_name: string | null;
  display_name: string | null;
  room_number: string | null;
};

type PrivateEvent = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  profiles?: Profile;
};

type EventFormData = {
  user_id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
};

const emptyForm: EventFormData = {
  user_id: "",
  title: "",
  description: "",
  starts_at: "",
  ends_at: "",
  all_day: false,
};

const monthNames = [
  "Januar", "Februar", "Marts", "April", "Maj", "Juni",
  "Juli", "August", "September", "Oktober", "November", "December",
];

function toLocalDatetimeString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default function AdminAftalerPage() {
  const [events, setEvents] = useState<PrivateEvent[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PrivateEvent | null>(null);
  const [formData, setFormData] = useState<EventFormData>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProfiles = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, display_name, room_number")
      .eq("role", "resident")
      .order("room_number");
    setProfiles(data || []);
  }, []);

  const fetchEvents = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    setLoading(true);
    setError(null);

    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

    try {
      let query = supabase
        .from("private_events")
        .select("*, profiles(id, full_name, display_name, room_number)")
        .gte("starts_at", startOfMonth.toISOString())
        .lte("starts_at", endOfMonth.toISOString())
        .order("starts_at");

      if (selectedUserId !== "all") {
        query = query.eq("user_id", selectedUserId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setEvents(data || []);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Kunne ikke hente aftaler.");
    } finally {
      setLoading(false);
    }
  }, [currentMonth, selectedUserId]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const getResidentName = (event: PrivateEvent): string => {
    if (event.profiles) {
      return event.profiles.display_name || event.profiles.full_name || "Ukendt";
    }
    const profile = profiles.find(p => p.id === event.user_id);
    return profile?.display_name || profile?.full_name || "Ukendt";
  };

  const getRoomNumber = (event: PrivateEvent): string | null => {
    if (event.profiles) {
      return event.profiles.room_number;
    }
    const profile = profiles.find(p => p.id === event.user_id);
    return profile?.room_number || null;
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    setFormData({
      ...emptyForm,
      starts_at: toLocalDatetimeString(now),
      user_id: selectedUserId !== "all" ? selectedUserId : "",
    });
    setShowModal(true);
  };

  const openEditModal = (event: PrivateEvent) => {
    setEditingEvent(event);
    setFormData({
      user_id: event.user_id,
      title: event.title,
      description: event.description || "",
      starts_at: toLocalDatetimeString(new Date(event.starts_at)),
      ends_at: event.ends_at ? toLocalDatetimeString(new Date(event.ends_at)) : "",
      all_day: event.all_day,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const supabase = createSupabaseBrowserClient();
    setSaving(true);
    setError(null);

    if (!formData.user_id) {
      setError("Vælg en beboer");
      setSaving(false);
      return;
    }

    const eventData = {
      user_id: formData.user_id,
      title: formData.title,
      description: formData.description || null,
      starts_at: new Date(formData.starts_at).toISOString(),
      ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
      all_day: formData.all_day,
    };

    try {
      if (editingEvent) {
        const { error } = await supabase
          .from("private_events")
          .update(eventData)
          .eq("id", editingEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("private_events")
          .insert(eventData);
        if (error) throw error;
      }

      setShowModal(false);
      fetchEvents();
    } catch (err) {
      console.error("Error saving event:", err);
      setError("Kunne ikke gemme aftalen.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event: PrivateEvent) => {
    if (!confirm(`Slet "${event.title}" for ${getResidentName(event)}?`)) return;

    const supabase = createSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from("private_events")
        .delete()
        .eq("id", event.id);
      if (error) throw error;
      fetchEvents();
    } catch (err) {
      console.error("Error deleting event:", err);
      setError("Kunne ikke slette aftalen.");
    }
  };

  const filteredEvents = events.filter((event) => {
    if (!searchQuery) return true;
    const name = getResidentName(event).toLowerCase();
    const title = event.title.toLowerCase();
    const room = getRoomNumber(event)?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return name.includes(query) || title.includes(query) || room.includes(query);
  });

  // Group events by date
  const groupedEvents: Record<string, PrivateEvent[]> = {};
  filteredEvents.forEach((event) => {
    const dateKey = event.starts_at.split("T")[0];
    if (!groupedEvents[dateKey]) {
      groupedEvents[dateKey] = [];
    }
    groupedEvents[dateKey].push(event);
  });
  const sortedDates = Object.keys(groupedEvents).sort();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Beboer Aftaler</h1>
          <p className="text-zinc-600">Administrer private aftaler for alle beboere</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Ny aftale
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Søg beboer, titel, værelse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
          />
        </div>

        {/* User Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none appearance-none bg-white"
            title="Filtrer efter beboer"
          >
            <option value="all">Alle beboere ({profiles.length})</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.room_number ? `Vær. ${profile.room_number} – ` : ""}
                {profile.display_name || profile.full_name || "Uden navn"}
              </option>
            ))}
          </select>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between p-2 rounded-xl border border-zinc-200 bg-white">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
            title="Forrige måned"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-600" />
          </button>
          <span className="font-medium text-zinc-800">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
            title="Næste måned"
          >
            <ChevronRight className="w-5 h-5 text-zinc-600" />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-zinc-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 rounded-2xl">
          <Calendar className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-600 mb-2">Ingen aftaler</h3>
          <p className="text-zinc-500">
            {selectedUserId !== "all" ? "Denne beboer har ingen aftaler denne måned" : "Ingen aftaler registreret denne måned"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                {new Date(dateKey + "T12:00:00").toLocaleDateString("da-DK", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h2>
              <div className="space-y-2">
                {groupedEvents[dateKey].map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-zinc-200 hover:shadow-md transition-shadow"
                  >
                    {/* Time */}
                    <div className="w-16 text-center shrink-0">
                      {event.all_day ? (
                        <span className="text-sm font-medium text-purple-600">Heldag</span>
                      ) : (
                        <span className="text-sm font-medium text-zinc-700">
                          {new Date(event.starts_at).toLocaleTimeString("da-DK", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-zinc-800 truncate">{event.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <User className="w-4 h-4" />
                        <span>{getResidentName(event)}</span>
                        {getRoomNumber(event) && (
                          <span className="px-2 py-0.5 bg-zinc-100 rounded text-xs">
                            Vær. {getRoomNumber(event)}
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm text-zinc-500 mt-1 truncate">{event.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openEditModal(event)}
                        className="p-2 text-zinc-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Rediger aftale"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(event)}
                        className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Slet aftale"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <h2 className="text-xl font-bold text-zinc-800">
                {editingEvent ? "Rediger aftale" : "Ny aftale"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                title="Luk"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* User Select */}
              <div>
                <label htmlFor="user_id" className="block text-sm font-medium text-zinc-700 mb-1">
                  Beboer *
                </label>
                <select
                  id="user_id"
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  required
                >
                  <option value="">Vælg beboer...</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.room_number ? `Vær. ${profile.room_number} – ` : ""}
                      {profile.display_name || profile.full_name || "Uden navn"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Titel *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  placeholder="Lægebesøg, Tandlæge, etc."
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Beskrivelse
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-none"
                  rows={2}
                  placeholder="Yderligere detaljer..."
                />
              </div>

              {/* All Day */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="all_day"
                  checked={formData.all_day}
                  onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
                  className="w-5 h-5 rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="all_day" className="text-sm font-medium text-zinc-700">
                  Heldagsbegivenhed
                </label>
              </div>

              {/* Start Time */}
              <div>
                <label htmlFor="starts_at" className="block text-sm font-medium text-zinc-700 mb-1">
                  {formData.all_day ? "Dato *" : "Starttidspunkt *"}
                </label>
                <input
                  id="starts_at"
                  type={formData.all_day ? "date" : "datetime-local"}
                  value={formData.all_day ? formData.starts_at.split("T")[0] : formData.starts_at}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      starts_at: formData.all_day ? e.target.value + "T00:00" : e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  required
                />
              </div>

              {/* End Time */}
              {!formData.all_day && (
                <div>
                  <label htmlFor="ends_at" className="block text-sm font-medium text-zinc-700 mb-1">
                    Sluttidspunkt
                  </label>
                  <input
                    id="ends_at"
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors font-medium"
              >
                Annuller
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.title || !formData.user_id || !formData.starts_at}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
