"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Loader2, CheckCircle, Bug } from "lucide-react";
import { isDev, devAutoLogin, DEV_ROOM_NUMBER, DEV_QR_CODE } from "@/lib/dev-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Development-only component that shows a dev login button
 * and auto-logs in when in development mode
 */
export function DevLoginBanner() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isDev()) return;

    const checkAuth = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setVisible(true);
    };

    checkAuth();
  }, []);

  const handleDevLogin = async () => {
    setStatus("loading");
    const result = await devAutoLogin();
    
    if (result.success) {
      setStatus("success");
      setIsLoggedIn(true);
      setTimeout(() => {
        router.refresh();
      }, 500);
    } else {
      setStatus("error");
      console.error("[Dev Login]", result.message);
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-100 bg-purple-600 text-white px-4 py-2 shadow-lg"
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-sm">
            <Bug className="w-4 h-4" />
            <span className="font-medium">DEV MODE</span>
            <span className="text-purple-200">|</span>
            <span className="text-purple-100">
              QR: <code className="bg-purple-700 px-1 rounded">{DEV_QR_CODE}</code>
            </span>
          </div>

          {isLoggedIn ? (
            <div className="flex items-center gap-2 text-sm text-purple-100">
              <CheckCircle className="w-4 h-4" />
              <span>Logged in as Room {DEV_ROOM_NUMBER}</span>
            </div>
          ) : (
            <button
              onClick={handleDevLogin}
              disabled={status === "loading"}
              className="flex items-center gap-2 bg-purple-700 hover:bg-purple-800 px-3 py-1 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logger ind...</span>
                </>
              ) : status === "success" ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Logget ind!</span>
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  <span>Dev Login (Room {DEV_ROOM_NUMBER})</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
