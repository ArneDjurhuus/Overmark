"use client";

import * as React from "react";
import { motion } from "framer-motion";

type Props = {
  children: React.ReactNode;
  className?: string;
};

function getTimeOfDayGradient(date: Date): {
  from: string;
  via: string;
  to: string;
} {
  const hour = date.getHours();

  // Morgen (5-10): varm orange/pink
  if (hour >= 5 && hour < 10) {
    return {
      from: "from-orange-100",
      via: "via-rose-50",
      to: "to-amber-50",
    };
  }

  // Formiddag (10-14): lys og klar
  if (hour >= 10 && hour < 14) {
    return {
      from: "from-sky-50",
      via: "via-white",
      to: "to-emerald-50/30",
    };
  }

  // Eftermiddag (14-18): varm gyldent
  if (hour >= 14 && hour < 18) {
    return {
      from: "from-amber-50",
      via: "via-orange-50/50",
      to: "to-rose-50",
    };
  }

  // Aften (18-22): blå/lilla overgang
  if (hour >= 18 && hour < 22) {
    return {
      from: "from-indigo-100",
      via: "via-purple-50",
      to: "to-slate-100",
    };
  }

  // Nat (22-5): dyb blå/mørk
  return {
    from: "from-slate-900",
    via: "via-indigo-950",
    to: "to-slate-950",
  };
}

function FloatingOrb({ delay, duration, size, color, position }: {
  delay: number;
  duration: number;
  size: string;
  color: string;
  position: string;
}) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-30 ${size} ${color} ${position}`}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export function DynamicBackground({ children, className }: Props) {
  const [now, setNow] = React.useState<Date>(() => new Date());
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const gradient = React.useMemo(() => getTimeOfDayGradient(now), [now]);
  const isNight = now.getHours() >= 22 || now.getHours() < 5;

  return (
    <div
      className={[
        "relative min-h-screen overflow-hidden transition-colors duration-1000",
        `bg-gradient-to-br ${gradient.from} ${gradient.via} ${gradient.to}`,
        isNight ? "dark" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Animated background orbs */}
      {mounted && (
        <div className="pointer-events-none absolute inset-0">
          <FloatingOrb
            delay={0}
            duration={8}
            size="w-96 h-96"
            color={isNight ? "bg-indigo-500" : "bg-rose-300"}
            position="-top-48 -left-48"
          />
          <FloatingOrb
            delay={2}
            duration={10}
            size="w-80 h-80"
            color={isNight ? "bg-purple-500" : "bg-amber-200"}
            position="top-1/3 -right-40"
          />
          <FloatingOrb
            delay={4}
            duration={12}
            size="w-64 h-64"
            color={isNight ? "bg-sky-600" : "bg-emerald-200"}
            position="bottom-20 left-1/4"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
