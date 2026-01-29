"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Pencil,
  X,
  Save,
  Home,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getRoleLabel, getRoleColor } from "@/types/user";

type Profile = {
  id: string;
  full_name: string | null;
  display_name: string | null;
  role: string;
  room_number: string | null;
  created_at: string | null;
};

type ProfileFormData = {
  full_name: string;
  display_name: string;
  role: string;
  room_number: string;
};

const roleOptions = [
  { value: "resident", label: "Beboer" },
  { value: "staff", label: "Personale" },
  { value: "admin", label: "Administrator" },
];

export default function AdminBrugerePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: "",
    display_name: "",
    role: "beboer",
    room_number: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    display_name: "",
    role: "staff",
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  const fetchProfiles = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setProfiles(data || []);
      setFilteredProfiles(data || []);
    } catch (err) {
      console.error("Error fetching profiles:", err);
      setError("Kunne ikke hente brugere.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProfiles(profiles);
      return;
    }

    const query = searchQuery.toLowerCase();
    setFilteredProfiles(
      profiles.filter(
        (p) =>
          p.full_name?.toLowerCase().includes(query) ||
          p.display_name?.toLowerCase().includes(query) ||
          p.room_number?.toLowerCase().includes(query) ||
          getRoleLabel(p.role).toLowerCase().includes(query)
      )
    );
  }, [searchQuery, profiles]);

  const openEditModal = (profile: Profile) => {
    setEditingProfile(profile);
    setFormData({
      full_name: profile.full_name || "",
      display_name: profile.display_name || "",
      role: profile.role,
      room_number: profile.room_number || "",
    });
    setShowModal(true);
  };

  const generateQRCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const ensureQRCodeForRoom = async (
    supabase: ReturnType<typeof createSupabaseBrowserClient>,
    roomNumber: string,
    residentName: string | null
  ) => {
    // Check if QR code exists for this room
    const { data: existing } = await supabase
      .from('room_qr_codes')
      .select('id')
      .eq('room_number', roomNumber)
      .eq('is_active', true)
      .single();

    if (!existing) {
      // Create new QR code for this room
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('room_qr_codes')
        .insert({
          room_number: roomNumber,
          code: generateQRCode(),
          resident_name: residentName,
          created_by: user?.id,
        });
    }
  };

  const handleSave = async () => {
    if (!editingProfile) return;

    const supabase = createSupabaseBrowserClient();
    setSaving(true);
    setError(null);

    const profileData = {
      full_name: formData.full_name || null,
      display_name: formData.display_name || null,
      role: formData.role,
      room_number: formData.room_number || null,
    };

    try {
      const { error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", editingProfile.id);

      if (error) throw error;

      // Auto-generate QR code if resident is assigned to a room
      if (profileData.room_number && profileData.role === 'resident') {
        await ensureQRCodeForRoom(
          supabase,
          profileData.room_number,
          profileData.display_name || profileData.full_name
        );
      }

      setShowModal(false);
      fetchProfiles();
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Kunne ikke gemme brugeren. Prøv igen.");
    } finally {
      setSaving(false);
    }
  };

  const getDisplayName = (profile: Profile): string => {
    return profile.display_name || profile.full_name || "Ukendt bruger";
  };

  const handleCreateStaff = async () => {
    if (!createFormData.email || !createFormData.password || !createFormData.full_name) {
      setCreateError("Udfyld venligst alle påkrævede felter");
      return;
    }

    setSaving(true);
    setCreateError(null);

    try {
      const response = await fetch("/api/admin/create-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createFormData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Kunne ikke oprette bruger");
      }

      setCreateSuccess(true);
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(false);
        setCreateFormData({
          email: "",
          password: "",
          full_name: "",
          display_name: "",
          role: "staff",
        });
        fetchProfiles();
      }, 1500);
    } catch (err) {
      console.error("Error creating staff:", err);
      setCreateError(err instanceof Error ? err.message : "Kunne ikke oprette bruger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Brugere</h1>
            <p className="text-slate-600 mt-1">
              Se og administrer beboere og personale
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Opret personale
          </button>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søg efter navn, værelse eller rolle..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </motion.div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-3 gap-4 mb-6"
      >
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-800">
            {profiles.filter((p) => p.role === "beboer").length}
          </div>
          <div className="text-sm text-slate-600">Beboere</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-800">
            {profiles.filter((p) => p.role === "personale" || p.role === "staff").length}
          </div>
          <div className="text-sm text-slate-600">Personale</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-800">
            {profiles.filter((p) => p.role === "admin").length}
          </div>
          <div className="text-sm text-slate-600">Administratorer</div>
        </div>
      </motion.div>

      {/* Users List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-slate-200 overflow-hidden"
      >
        {loading ? (
          <div className="space-y-4 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">
              {searchQuery ? "Ingen brugere matcher din søgning" : "Ingen brugere fundet"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                    {getDisplayName(profile).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">
                        {getDisplayName(profile)}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(
                          profile.role
                        )}`}
                      >
                        {getRoleLabel(profile.role)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                      {profile.room_number && (
                        <span className="flex items-center gap-1">
                          <Home className="w-3.5 h-3.5" />
                          Værelse {profile.room_number}
                        </span>
                      )}
                      {profile.created_at && (
                        <span>
                          Oprettet{" "}
                          {new Date(profile.created_at).toLocaleDateString("da-DK")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => openEditModal(profile)}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                  title="Rediger"
                >
                  <Pencil className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Results count */}
      {!loading && (
        <p className="mt-4 text-sm text-slate-500 text-center">
          Viser {filteredProfiles.length} af {profiles.length} brugere
        </p>
      )}

      {/* Modal */}
      {showModal && editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Rediger bruger</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Luk"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                  {getDisplayName(editingProfile).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {getDisplayName(editingProfile)}
                  </p>
                  <p className="text-sm text-slate-500">ID: {editingProfile.id.slice(0, 8)}...</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fulde navn
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="F.eks. Hans Hansen"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Visningsnavn
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData({ ...formData, display_name: e.target.value })
                  }
                  placeholder="F.eks. Hans"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Værelsenummer
                </label>
                <input
                  type="text"
                  value={formData.room_number}
                  onChange={(e) =>
                    setFormData({ ...formData, room_number: e.target.value })
                  }
                  placeholder="F.eks. 5"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rolle
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  aria-label="Rolle"
                >
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Bemærk: Ændring af rolle påvirker brugerens adgang til admin-panelet
                </p>
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
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? "Gemmer..." : "Gem ændringer"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Opret personalekonto</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError(null);
                }}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Luk"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {createSuccess ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Save className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Konto oprettet!</h3>
                <p className="text-slate-600">
                  {createFormData.full_name} kan nu logge ind på admin-panelet.
                </p>
              </div>
            ) : (
              <>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={createFormData.email}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, email: e.target.value })
                        }
                        placeholder="medarbejder@overmark.dk"
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Adgangskode *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={createFormData.password}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, password: e.target.value })
                        }
                        placeholder="Mindst 6 tegn"
                        className="w-full pl-10 pr-12 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Fulde navn *
                    </label>
                    <input
                      type="text"
                      value={createFormData.full_name}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, full_name: e.target.value })
                      }
                      placeholder="F.eks. Hans Hansen"
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Visningsnavn
                    </label>
                    <input
                      type="text"
                      value={createFormData.display_name}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, display_name: e.target.value })
                      }
                      placeholder="F.eks. Hans (valgfrit)"
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Rolle
                    </label>
                    <select
                      value={createFormData.role}
                      onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      aria-label="Rolle"
                    >
                      <option value="staff">Personale</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-500">
                      Administratorer kan oprette og administrere andre brugere
                    </p>
                  </div>

                  {createError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                      {createError}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateError(null);
                    }}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Annuller
                  </button>
                  <button
                    onClick={handleCreateStaff}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserPlus className="w-4 h-4" />
                    {saving ? "Opretter..." : "Opret konto"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
