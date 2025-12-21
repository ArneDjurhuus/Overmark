"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  MessageCircle,
  Send,
  AlertCircle,
  User,
} from "lucide-react";
import { DynamicBackground } from "../components/DynamicBackground";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ChatMessage = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    display_name: string | null;
    full_name: string | null;
    role: string;
  };
};

type Profile = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  role: string;
};

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("da-DK", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("da-DK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDisplayName(profile?: Profile | ChatMessage["profiles"]): string {
  if (!profile) return "Ukendt";
  return profile.display_name || profile.full_name || "Beboer";
}

function getRoleColor(role?: string): string {
  switch (role) {
    case "staff":
    case "personale":
      return "bg-blue-100 text-blue-700";
    case "admin":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

function getRoleLabel(role?: string): string {
  switch (role) {
    case "staff":
    case "personale":
      return "Personale";
    case "admin":
      return "Admin";
    default:
      return "";
  }
}

export default function SnakkerumPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [prefersReducedMotion]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function initialize() {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Get profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          setCurrentUser(profile);
        }

        // Check if banned
        const { data: ban } = await supabase
          .from("chat_bans")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (ban) {
          setIsBanned(true);
        }
      }

      // Fetch messages
      const { data: messagesData } = await supabase
        .from("chat_messages")
        .select(
          `
          *,
          profiles:user_id (
            display_name,
            full_name,
            role
          )
        `
        )
        .eq("moderation_passed", true)
        .order("created_at", { ascending: true })
        .limit(100);

      setMessages(messagesData || []);
      setLoading(false);

      // Subscribe to new messages
      const channel = supabase
        .channel("chat-messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: "moderation_passed=eq.true",
          },
          async (payload) => {
            // Fetch the full message with profile
            const { data } = await supabase
              .from("chat_messages")
              .select(
                `
                *,
                profiles:user_id (
                  display_name,
                  full_name,
                  role
                )
              `
              )
              .eq("id", payload.new.id)
              .single();

            if (data) {
              setMessages((prev) => [...prev, data]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    initialize();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || isBanned || !currentUser) return;

    setError(null);
    setSending(true);

    const supabase = createSupabaseBrowserClient();

    // For now, we'll mark messages as passed (AI moderation would be added via Edge Function)
    const { error: insertError } = await supabase.from("chat_messages").insert({
      user_id: currentUser.id,
      content: newMessage.trim(),
      is_moderated: true,
      moderation_passed: true, // This would be set by AI moderation in production
    });

    if (insertError) {
      setError("Kunne ikke sende besked. Prøv igen.");
    } else {
      setNewMessage("");
    }

    setSending(false);
  };

  return (
    <DynamicBackground>
      <div className="min-h-full flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 px-4 py-4 bg-white/60 backdrop-blur-lg border-b border-white/30"
        >
          <h1 className="text-2xl font-bold text-zinc-800">Snakkerum</h1>
          <p className="text-sm text-zinc-600">Chat med andre beboere</p>
        </motion.div>

        {/* Banned Message */}
        {isBanned && (
          <div className="flex-shrink-0 px-4 py-3 bg-red-50 border-b border-red-100">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">
                Du er blevet udelukket fra chatten på grund af upassende
                adfærd.
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex gap-3 animate-pulse"
                >
                  <div className="w-10 h-10 rounded-full bg-white/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-white/50 rounded" />
                    <div className="h-16 w-3/4 bg-white/50 rounded-2xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-zinc-700 mb-2">
                Ingen beskeder endnu
              </h3>
              <p className="text-zinc-500">Vær den første til at skrive!</p>
            </div>
          ) : (
            messages.map((message, idx) => {
              const isOwnMessage = message.user_id === currentUser?.id;
              const profile = message.profiles;
              const roleLabel = getRoleLabel(profile?.role);

              return (
                <motion.div
                  key={message.id}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: 10 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`flex gap-3 ${
                    isOwnMessage ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isOwnMessage
                        ? "bg-blue-500 text-white"
                        : "bg-white/60 text-zinc-600"
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </div>

                  {/* Message content */}
                  <div
                    className={`max-w-[75%] ${
                      isOwnMessage ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Name and role */}
                    <div
                      className={`flex items-center gap-2 mb-1 ${
                        isOwnMessage ? "justify-end" : ""
                      }`}
                    >
                      <span className="text-sm font-medium text-zinc-700">
                        {isOwnMessage ? "Dig" : getDisplayName(profile)}
                      </span>
                      {roleLabel && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(
                            profile?.role
                          )}`}
                        >
                          {roleLabel}
                        </span>
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        isOwnMessage
                          ? "bg-blue-500 text-white rounded-br-md"
                          : "bg-white/70 backdrop-blur-md text-zinc-800 rounded-bl-md"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>

                    {/* Timestamp */}
                    <p
                      className={`text-xs text-zinc-500 mt-1 ${
                        isOwnMessage ? "text-right" : ""
                      }`}
                    >
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {!isBanned && currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-shrink-0 px-4 py-4 bg-white/60 backdrop-blur-lg border-t border-white/30"
          >
            {error && (
              <p className="text-sm text-red-600 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Skriv en besked..."
                className="flex-1 px-4 py-3 rounded-2xl border border-zinc-200 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                disabled={sending}
                maxLength={500}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="p-3 rounded-2xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send besked"
              >
                <Send className="w-6 h-6" />
              </button>
            </form>
          </motion.div>
        )}

        {/* Login prompt if no user */}
        {!currentUser && !loading && (
          <div className="flex-shrink-0 px-4 py-4 bg-amber-50 border-t border-amber-100">
            <p className="text-sm text-amber-800 text-center">
              Du skal være logget ind for at deltage i chatten.
            </p>
          </div>
        )}
      </div>
    </DynamicBackground>
  );
}
