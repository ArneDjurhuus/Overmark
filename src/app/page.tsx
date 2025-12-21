"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Utensils, Home as HomeIcon, Calendar, MessageCircle, Sparkles, Building2, ExternalLink, Clock, CalendarDays } from "lucide-react";
import { DynamicBackground } from "./components/DynamicBackground";
import { AnimatedCard } from "./components/AnimatedCard";
import Link from "next/link";

const housingLinks = [
  { name: "Boligportalen", url: "https://www.boligportalen.dk", color: "bg-blue-500" },
  { name: "Lejebolig", url: "https://www.lejebolig.dk", color: "bg-emerald-500" },
  { name: "Boligsiden", url: "https://www.boligsiden.dk", color: "bg-orange-500" },
  { name: "DBA Boliger", url: "https://www.dba.dk/boliger", color: "bg-rose-500" },
  { name: "Findbolig", url: "https://www.findbolig.nu", color: "bg-purple-500" },
  { name: "AKU Aarhus", url: "https://www.LejIAarhus.dk", color: "bg-teal-500" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function useTimeGreeting() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) return "God morgen";
    if (hour >= 12 && hour < 18) return "God eftermiddag";
    if (hour >= 18 && hour < 22) return "God aften";
    return "God nat";
  }, [now]);

  const timeString = useMemo(() => {
    return now.toLocaleTimeString("da-DK", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [now]);

  const dateString = useMemo(() => {
    return now.toLocaleDateString("da-DK", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [now]);

  return { greeting, timeString, dateString };
}

function LiveClock() {
  const { timeString, dateString } = useTimeGreeting();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/40 backdrop-blur-md border border-white/30 shadow-lg"
    >
      <Clock className="w-5 h-5 text-zinc-600" />
      <div className="text-right">
        <div className="text-2xl font-bold tabular-nums text-zinc-800 leading-tight">
          {timeString}
        </div>
        <div className="text-xs text-zinc-500 capitalize">{dateString}</div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { greeting } = useTimeGreeting();
  const prefersReducedMotion = useReducedMotion();

  return (
    <DynamicBackground className="px-4 py-6 pb-24">
      <main className="mx-auto w-full max-w-4xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          {/* Top bar with badge and clock */}
          <div className="flex items-center justify-between mb-6">
            <motion.div
              initial={{ scale: 0, x: -20 }}
              animate={{ scale: 1, x: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-white/30 shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
              <span className="text-sm font-medium text-zinc-700">
                Overmarksgården
              </span>
            </motion.div>
            <LiveClock />
          </div>

          {/* Main greeting */}
          <div className="text-center">
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-800 bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {greeting}{" "}
              <motion.span
                className="inline-block"
                animate={prefersReducedMotion ? undefined : { rotate: [0, 14, -8, 14, -4, 10, 0] }}
                transition={prefersReducedMotion ? undefined : { duration: 2.5, delay: 1, repeat: Infinity, repeatDelay: 5 }}
              >
                👋
              </motion.span>
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Dit digitale hjem – alt det vigtige, samlet ét sted
            </motion.p>
          </div>
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-5 sm:grid-cols-2"
        >
          {/* Madplan */}
          <motion.div variants={item}>
            <Link href="/madplan">
              <AnimatedCard
                icon={<Utensils className="w-6 h-6 text-orange-600" />}
                delay={0}
                accentColor="from-orange-100/80 to-amber-50/60"
                ariaLabel="Gå til madplan"
              >
                <h3 className="text-lg font-semibold text-zinc-800 mb-1">
                  Madplan
                </h3>
                <p className="text-zinc-600 text-sm mb-3">
                  Se ugens måltider
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-full bg-gradient-to-r from-orange-200/80 to-orange-100/40 rounded-full animate-pulse" />
                    <div className="h-3 w-2/3 bg-gradient-to-r from-orange-200/60 to-orange-100/30 rounded-full animate-pulse" />
                  </div>
                  <motion.span
                    className="text-3xl"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    🍲
                  </motion.span>
                </div>
              </AnimatedCard>
            </Link>
          </motion.div>

          {/* Fælleskalender */}
          <motion.div variants={item}>
            <Link href="/faelleskalender">
              <AnimatedCard
                icon={<Calendar className="w-6 h-6 text-purple-600" />}
                delay={0.1}
                accentColor="from-purple-100/80 to-violet-50/60"
                ariaLabel="Gå til fælleskalender"
              >
                <h3 className="text-lg font-semibold text-zinc-800 mb-1">
                  Fælleskalender
                </h3>
                <p className="text-zinc-600 text-sm mb-3">
                  Se husets aktiviteter
                </p>
                <div className="flex gap-2">
                  {["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"].map((day, i) => (
                    <motion.div
                      key={day}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                        i === new Date().getDay() - 1 || (new Date().getDay() === 0 && i === 6)
                          ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                          : "bg-white/50 text-zinc-600"
                      }`}
                    >
                      {day}
                    </motion.div>
                  ))}
                </div>
              </AnimatedCard>
            </Link>
          </motion.div>

          {/* Min Kalender */}
          <motion.div variants={item}>
            <Link href="/min-kalender">
              <AnimatedCard
                icon={<CalendarDays className="w-6 h-6 text-blue-600" />}
                delay={0.2}
                accentColor="from-blue-100/80 to-sky-50/60"
                ariaLabel="Gå til din personlige kalender"
              >
                <h3 className="text-lg font-semibold text-zinc-800 mb-1">
                  Min Kalender
                </h3>
                <p className="text-zinc-600 text-sm mb-3">
                  Dine personlige aftaler
                </p>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                  </span>
                  <span className="text-sm text-blue-700 font-medium">
                    Hold styr på dine aftaler
                  </span>
                </div>
              </AnimatedCard>
            </Link>
          </motion.div>

          {/* Snakkerum */}
          <motion.div variants={item}>
            <Link href="/snakkerum">
              <AnimatedCard
                icon={<MessageCircle className="w-6 h-6 text-emerald-600" />}
                delay={0.3}
                accentColor="from-emerald-100/80 to-teal-50/60"
                ariaLabel="Gå til snakkerum"
              >
                <h3 className="text-lg font-semibold text-zinc-800 mb-1">
                  Snakkerum
                </h3>
                <p className="text-zinc-600 text-sm mb-3">
                  Chat med andre beboere
                </p>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                  <span className="text-sm text-emerald-700 font-medium">
                    Fælles snak
                  </span>
                </div>
              </AnimatedCard>
            </Link>
          </motion.div>
        </motion.div>

        {/* Boligsøgning Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-8"
        >
          <AnimatedCard
            icon={<Building2 className="w-6 h-6 text-sky-600" />}
            delay={0.4}
            accentColor="from-sky-100/80 to-blue-50/60"
          >
            <h3 className="text-lg font-semibold text-zinc-800 mb-1">
              Boligsøgning
            </h3>
            <p className="text-zinc-600 text-sm mb-4">
              Find din næste bolig – her er de bedste sider
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {housingLinks.map((link, i) => (
                <motion.a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl ${link.color} text-white text-sm font-medium shadow-md hover:shadow-lg transition-shadow`}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + i * 0.05 }}
                >
                  <span className="truncate">{link.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                </motion.a>
              ))}
            </div>
          </AnimatedCard>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-12 pb-6 space-y-4"
        >
          <div className="flex items-center justify-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-300 to-transparent" />
            <motion.span
              className="text-zinc-400 text-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ✨
            </motion.span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-zinc-300 to-transparent" />
          </div>
          <p className="text-center text-sm text-zinc-500">
            Tryk på et kort for at se mere
          </p>
          <p className="text-center text-xs text-zinc-400">
            Overmarksgården Intra v1.0 • Lavet med{" "}
            <motion.span
              className="inline-block text-rose-400"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
            >
              ♥
            </motion.span>
          </p>
        </motion.footer>
      </main>
    </DynamicBackground>
  );
}
