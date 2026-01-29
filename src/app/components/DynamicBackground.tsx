"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  children: React.ReactNode;
  className?: string;
};

type GradientConfig = {
  from: string;
  via: string;
  to: string;
  orbs: { color: string; secondaryColor: string };
  accent: string;
};

function getTimeOfDayGradient(date: Date): GradientConfig {
  const hour = date.getHours();

  // Morgen (5-10): varm orange/pink solopgang
  if (hour >= 5 && hour < 10) {
    return {
      from: "from-orange-100",
      via: "via-rose-50",
      to: "to-amber-50",
      orbs: { color: "bg-rose-300", secondaryColor: "bg-orange-200" },
      accent: "bg-amber-300",
    };
  }

  // Formiddag (10-14): lys og klar dag
  if (hour >= 10 && hour < 14) {
    return {
      from: "from-sky-50",
      via: "via-white",
      to: "to-emerald-50/30",
      orbs: { color: "bg-sky-200", secondaryColor: "bg-emerald-100" },
      accent: "bg-cyan-200",
    };
  }

  // Eftermiddag (14-18): varm gyldent
  if (hour >= 14 && hour < 18) {
    return {
      from: "from-amber-50",
      via: "via-orange-50/50",
      to: "to-rose-50",
      orbs: { color: "bg-amber-200", secondaryColor: "bg-rose-200" },
      accent: "bg-orange-200",
    };
  }

  // Aften (18-22): blå/lilla solnedgang
  if (hour >= 18 && hour < 22) {
    return {
      from: "from-indigo-100",
      via: "via-purple-50",
      to: "to-slate-100",
      orbs: { color: "bg-purple-300", secondaryColor: "bg-indigo-200" },
      accent: "bg-violet-300",
    };
  }

  // Nat (22-5): dyb blå/mørk med stjerner
  return {
    from: "from-slate-900",
    via: "via-indigo-950",
    to: "to-slate-950",
    orbs: { color: "bg-indigo-500", secondaryColor: "bg-purple-600" },
    accent: "bg-sky-500",
  };
}

function FloatingOrb({
  delay,
  duration,
  size,
  color,
  position,
  reduceMotion,
  blur = "blur-3xl",
  opacity = "opacity-30",
}: {
  delay: number;
  duration: number;
  size: string;
  color: string;
  position: string;
  reduceMotion?: boolean;
  blur?: string;
  opacity?: string;
}) {
  if (reduceMotion) {
    return (
      <div
        className={`absolute rounded-full ${blur} ${opacity.replace(
          "30",
          "20"
        )} ${size} ${color} ${position}`}
      />
    );
  }

  return (
    <motion.div
      className={`absolute rounded-full ${blur} ${opacity} ${size} ${color} ${position}`}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, 0],
        scale: [1, 1.15, 1],
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

function MeshGradient({
  reduceMotion,
  isNight,
}: {
  reduceMotion: boolean;
  isNight: boolean;
}) {
  if (reduceMotion) return null;

  return (
    <motion.div
      className="absolute inset-0 opacity-40"
      animate={{
        background: isNight
          ? [
              "radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.3) 0%, transparent 50%)",
              "radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)",
              "radial-gradient(at 0% 100%, rgba(99, 102, 241, 0.3) 0%, transparent 50%)",
              "radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.3) 0%, transparent 50%)",
            ]
          : [
              "radial-gradient(at 0% 0%, rgba(251, 191, 36, 0.2) 0%, transparent 50%)",
              "radial-gradient(at 100% 0%, rgba(244, 114, 182, 0.2) 0%, transparent 50%)",
              "radial-gradient(at 100% 100%, rgba(34, 211, 238, 0.2) 0%, transparent 50%)",
              "radial-gradient(at 0% 0%, rgba(251, 191, 36, 0.2) 0%, transparent 50%)",
            ],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

// Pre-computed star positions using seeded pseudo-random values
// This creates deterministic positions that don't change between renders
const STAR_DATA = Array.from({ length: 50 }, (_, i) => {
  // Simple seeded pseudo-random based on index
  const seed1 = ((i * 9301 + 49297) % 233280) / 233280;
  const seed2 = ((i * 7901 + 12345) % 233280) / 233280;
  const seed3 = (((i + 1) * 5501 + 67890) % 233280) / 233280;
  const seed4 = (((i + 2) * 3301 + 11111) % 233280) / 233280;
  const seed5 = (((i + 3) * 1101 + 22222) % 233280) / 233280;

  return {
    id: i,
    x: seed1 * 100,
    y: seed2 * 100,
    size: seed3 * 2 + 1,
    delay: seed4 * 3,
    duration: seed5 * 2 + 2,
  };
});

function Stars({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="absolute inset-0">
      {STAR_DATA.map((star) =>
        reduceMotion ? (
          <div
            key={star.id}
            className={`absolute rounded-full bg-white opacity-60 star-${star.id}`}
          />
        ) : (
          <motion.div
            key={star.id}
            className={`absolute rounded-full bg-white star-${star.id}`}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )
      )}
    </div>
  );
}

function WavePattern({
  isNight,
  reduceMotion,
}: {
  isNight: boolean;
  reduceMotion: boolean;
}) {
  if (reduceMotion) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-64 overflow-hidden">
      <motion.div
        className={`absolute bottom-0 left-0 right-0 h-32 ${
          isNight ? "opacity-10" : "opacity-20"
        }`}
        style={{
          background: isNight
            ? "linear-gradient(180deg, transparent, rgba(99, 102, 241, 0.3))"
            : "linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.5))",
          borderRadius: "100% 100% 0 0",
        }}
        animate={{
          scaleX: [1, 1.05, 1],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className={`absolute bottom-0 left-0 right-0 h-24 ${
          isNight ? "opacity-5" : "opacity-10"
        }`}
        style={{
          background: isNight
            ? "linear-gradient(180deg, transparent, rgba(139, 92, 246, 0.3))"
            : "linear-gradient(180deg, transparent, rgba(251, 191, 36, 0.3))",
          borderRadius: "100% 100% 0 0",
        }}
        animate={{
          scaleX: [1.05, 1, 1.05],
          y: [0, -5, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

export function DynamicBackground({ children, className }: Props) {
  const [now, setNow] = React.useState<Date>(() => new Date());
  const [mounted, setMounted] = React.useState(false);
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    setMounted(true);
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const config = React.useMemo(() => getTimeOfDayGradient(now), [now]);
  const isNight = now.getHours() >= 22 || now.getHours() < 5;
  const reduceMotion = prefersReducedMotion ?? false;

  return (
    <div
      className={[
        "relative min-h-screen overflow-hidden transition-colors duration-1000",
        `bg-linear-to-br ${config.from} ${config.via} ${config.to}`,
        isNight ? "dark" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Animated background effects */}
      {mounted && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {/* Mesh gradient overlay */}
          <MeshGradient reduceMotion={reduceMotion} isNight={isNight} />

          {/* Stars for night mode */}
          {isNight && <Stars reduceMotion={reduceMotion} />}

          {/* Primary floating orbs */}
          <FloatingOrb
            delay={0}
            duration={8}
            size="w-96 h-96"
            color={config.orbs.color}
            position="-top-48 -left-48"
            reduceMotion={reduceMotion}
          />
          <FloatingOrb
            delay={2}
            duration={10}
            size="w-80 h-80"
            color={config.orbs.secondaryColor}
            position="top-1/3 -right-40"
            reduceMotion={reduceMotion}
          />
          <FloatingOrb
            delay={4}
            duration={12}
            size="w-64 h-64"
            color={config.accent}
            position="bottom-20 left-1/4"
            reduceMotion={reduceMotion}
          />

          {/* Additional smaller orbs for depth */}
          <FloatingOrb
            delay={1}
            duration={15}
            size="w-48 h-48"
            color={config.orbs.color}
            position="top-1/2 left-10"
            reduceMotion={reduceMotion}
            opacity="opacity-20"
          />
          <FloatingOrb
            delay={3}
            duration={9}
            size="w-32 h-32"
            color={config.orbs.secondaryColor}
            position="bottom-40 right-1/4"
            reduceMotion={reduceMotion}
            blur="blur-2xl"
            opacity="opacity-25"
          />
          <FloatingOrb
            delay={5}
            duration={11}
            size="w-56 h-56"
            color={config.accent}
            position="-bottom-20 -right-20"
            reduceMotion={reduceMotion}
          />

          {/* Wave pattern at bottom */}
          <WavePattern isNight={isNight} reduceMotion={reduceMotion} />

          {/* Subtle noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.015] noise-texture" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
