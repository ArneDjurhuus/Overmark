"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Utensils, Calendar, MessageCircle, User } from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "Hjem" },
  { href: "/madplan", icon: Utensils, label: "Madplan" },
  { href: "/faelleskalender", icon: Calendar, label: "Kalender" },
  { href: "/snakkerum", icon: MessageCircle, label: "Chat" },
  { href: "/profil", icon: User, label: "Profil" },
];

export function BottomNav() {
  const pathname = usePathname();

  // Don't show on login page
  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-zinc-200/50 pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-16 py-2 rounded-2xl transition-colors"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 bg-blue-100 rounded-2xl"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                className={`relative z-10 w-6 h-6 transition-colors ${
                  isActive ? "text-blue-600" : "text-zinc-500"
                }`}
              />
              <span
                className={`relative z-10 text-xs mt-1 font-medium transition-colors ${
                  isActive ? "text-blue-600" : "text-zinc-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
