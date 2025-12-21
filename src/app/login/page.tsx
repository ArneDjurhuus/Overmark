"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, AlertCircle, Sparkles } from "lucide-react";
import { DynamicBackground } from "../components/DynamicBackground";
import { AnimatedCard } from "../components/AnimatedCard";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createSupabaseBrowserClient();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Forkert email eller adgangskode"
          : "Noget gik galt. Prøv igen."
      );
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <DynamicBackground>
      <div className="min-h-full flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo/Brand */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-white/30 shadow-lg mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="font-medium text-zinc-700">Overmarksgården</span>
            </div>
            <h1 className="text-3xl font-bold text-zinc-800 mb-2">
              Velkommen tilbage
            </h1>
            <p className="text-zinc-600">Log ind for at fortsætte</p>
          </motion.div>

          {/* Login Card */}
          <AnimatedCard delay={0.15}>
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-zinc-200 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-lg"
                    placeholder="din@email.dk"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Adgangskode
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-zinc-200 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-lg"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-500 text-white text-lg font-semibold rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
              >
                {loading ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Logger ind...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Log ind
                  </>
                )}
              </button>
            </form>
          </AnimatedCard>

          {/* Help text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-sm text-zinc-500 mt-6"
          >
            Problemer med at logge ind?
            <br />
            Spørg personalet om hjælp
          </motion.p>
        </motion.div>
      </div>
    </DynamicBackground>
  );
}
