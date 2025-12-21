"use client";

import { motion } from "framer-motion";
import { Utensils, Home as HomeIcon, Calendar, MessageCircleHeart, Sparkles } from "lucide-react";
import { DynamicBackground } from "./components/DynamicBackground";
import { AnimatedCard } from "./components/AnimatedCard";

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

function TimeGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "God morgen";
  if (hour >= 12 && hour < 18) return "God eftermiddag";
  if (hour >= 18 && hour < 22) return "God aften";
  return "God nat";
}

export default function Home() {
  return (
    <DynamicBackground className="px-4 py-8 sm:px-6 lg:px-8">
      <main className="mx-auto w-full max-w-4xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-white/30 shadow-lg mb-6"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-zinc-700">
              Overmarksgården Intra
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-800 bg-clip-text text-transparent mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <TimeGreeting /> 👋
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Dit digitale hjem – alt det vigtige, samlet ét sted
          </motion.p>
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-5 sm:grid-cols-2"
        >
          {/* Dagens ret */}
          <motion.div variants={item}>
            <AnimatedCard
              icon={<Utensils className="w-6 h-6 text-orange-600" />}
              delay={0}
              accentColor="from-orange-100/80 to-amber-50/60"
            >
              <h3 className="text-lg font-semibold text-zinc-800 mb-1">
                Dagens ret
              </h3>
              <p className="text-zinc-600 text-sm mb-3">
                Se hvad køkkenet byder på i dag
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
          </motion.div>

          {/* Husets status */}
          <motion.div variants={item}>
            <AnimatedCard
              icon={<HomeIcon className="w-6 h-6 text-emerald-600" />}
              delay={0.1}
              accentColor="from-emerald-100/80 to-teal-50/60"
            >
              <h3 className="text-lg font-semibold text-zinc-800 mb-1">
                Husets status
              </h3>
              <p className="text-zinc-600 text-sm mb-3">
                Hvad sker der lige nu?
              </p>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <span className="text-sm text-emerald-700 font-medium">
                  Alt kører normalt
                </span>
              </div>
            </AnimatedCard>
          </motion.div>

          {/* Aktiviteter */}
          <motion.div variants={item}>
            <AnimatedCard
              icon={<Calendar className="w-6 h-6 text-purple-600" />}
              delay={0.2}
              accentColor="from-purple-100/80 to-violet-50/60"
            >
              <h3 className="text-lg font-semibold text-zinc-800 mb-1">
                Aktiviteter
              </h3>
              <p className="text-zinc-600 text-sm mb-3">
                Se ugens program og tilmeld dig
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
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {day}
                  </motion.div>
                ))}
              </div>
            </AnimatedCard>
          </motion.div>

          {/* Snak med en */}
          <motion.div variants={item}>
            <AnimatedCard
              icon={<MessageCircleHeart className="w-6 h-6 text-rose-600" />}
              delay={0.3}
              accentColor="from-rose-100/80 to-pink-50/60"
            >
              <h3 className="text-lg font-semibold text-zinc-800 mb-1">
                Brug for en snak?
              </h3>
              <p className="text-zinc-600 text-sm mb-3">
                Book tid med en medarbejder
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 transition-shadow"
              >
                Anmod om samtale
              </motion.button>
            </AnimatedCard>
          </motion.div>
        </motion.div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center text-sm text-zinc-500 mt-10"
        >
          Tryk på et kort for at se mere ✨
        </motion.p>
      </main>
    </DynamicBackground>
  );
}
