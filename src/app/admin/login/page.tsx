"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Check if user is staff or admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.role !== "staff" && profile.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("Du har ikke adgang til administrationspanelet.");
      }

      // Redirect to admin dashboard
      router.push("/admin");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof Error) {
        if (err.message.includes("Invalid login credentials")) {
          setError("Forkert email eller adgangskode.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Der skete en fejl. Prøv igen.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Overmarksgården
          </h1>
          <p className="text-slate-400">Administration</p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@email.dk"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Adgangskode
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-linear-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Logger ind...
                </>
              ) : (
                "Log ind"
              )}
            </button>
          </form>
        </motion.div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Kun for medarbejdere
        </p>
      </motion.div>
    </main>
  );
}
