"use client";

import * as React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

function getTimeOfDayGradientClass(date: Date): string {
  const hour = date.getHours();

  // Morgen: varm og blød
  if (hour >= 5 && hour < 11) {
    return "bg-gradient-to-b from-amber-50 to-zinc-50 dark:from-amber-950/30 dark:to-black";
  }

  // Dag: neutral og lys
  if (hour >= 11 && hour < 17) {
    return "bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black";
  }

  // Aften/nat: rolig blå
  return "bg-gradient-to-b from-sky-50 to-zinc-50 dark:from-sky-950/30 dark:to-black";
}

export function DynamicBackground({ children, className }: Props) {
  const [now, setNow] = React.useState<Date>(() => new Date());

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const gradientClass = React.useMemo(() => getTimeOfDayGradientClass(now), [now]);

  return (
    <div className={["min-h-screen", gradientClass, className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
