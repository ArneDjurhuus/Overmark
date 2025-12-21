"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  icon?: ReactNode;
  delay?: number;
  className?: string;
  accentColor?: string;
};

export function AnimatedCard({
  children,
  icon,
  delay = 0,
  className,
  accentColor = "from-white/60 to-white/40",
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={[
        "group relative overflow-hidden rounded-3xl p-6",
        "backdrop-blur-xl border border-white/30",
        `bg-gradient-to-br ${accentColor}`,
        "shadow-xl shadow-black/5",
        "transition-shadow duration-300 hover:shadow-2xl hover:shadow-black/10",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Shine effect on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Icon container */}
      {icon && (
        <motion.div
          className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/50 backdrop-blur-sm shadow-lg"
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.4 }}
        >
          {icon}
        </motion.div>
      )}

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
