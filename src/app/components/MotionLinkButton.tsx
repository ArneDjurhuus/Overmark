"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
};

export function MotionLinkButton({ href, children, className, ariaLabel }: Props) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Link
        href={href}
        aria-label={ariaLabel}
        className={[
          "inline-flex h-12 items-center justify-center rounded-full px-5 text-base font-semibold",
          "bg-foreground text-background",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </Link>
    </motion.div>
  );
}
