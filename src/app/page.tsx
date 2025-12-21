import { DynamicBackground } from "./components/DynamicBackground";
import { MotionLinkButton } from "./components/MotionLinkButton";

export default function Home() {
  return (
    <DynamicBackground className="px-4 py-10 sm:px-8">
      <main className="mx-auto w-full max-w-3xl">
        <section className="backdrop-blur-md bg-white/40 dark:bg-white/10 rounded-2xl border border-white/20 shadow-lg">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6">
              <header className="flex flex-col gap-2">
                <p className="text-sm font-semibold tracking-wide text-zinc-700 dark:text-zinc-300">
                  Overmarksgården
                </p>
                <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground">
                  Intra – et digitalt hjem
                </h1>
                <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300">
                  Et sted hvor beboere og personale hurtigt kan finde det vigtigste – uden
                  støj og uden institutionel følelse.
                </p>
              </header>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <MotionLinkButton href="/" ariaLabel="Gå til dashboard (kommer snart)">
                  Kom i gang
                </MotionLinkButton>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  (Dashboard og login kommer næste.)
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">Dagens Puls</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Hurtige overblikskort – opdateres senere med live data.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="backdrop-blur-md bg-white/30 dark:bg-white/10 rounded-2xl border border-white/20 shadow-lg p-5">
              <p className="text-sm font-semibold text-foreground">Dagens ret</p>
              <div className="mt-3 space-y-2">
                <div className="animate-pulse bg-zinc-200/60 dark:bg-zinc-800/60 rounded-lg h-5 w-3/4" />
                <div className="animate-pulse bg-zinc-200/60 dark:bg-zinc-800/60 rounded-lg h-5 w-1/2" />
              </div>
            </div>

            <div className="backdrop-blur-md bg-white/30 dark:bg-white/10 rounded-2xl border border-white/20 shadow-lg p-5">
              <p className="text-sm font-semibold text-foreground">Vejr</p>
              <div className="mt-3 space-y-2">
                <div className="animate-pulse bg-zinc-200/60 dark:bg-zinc-800/60 rounded-lg h-5 w-2/3" />
                <div className="animate-pulse bg-zinc-200/60 dark:bg-zinc-800/60 rounded-lg h-5 w-1/3" />
              </div>
            </div>

            <div className="backdrop-blur-md bg-white/30 dark:bg-white/10 rounded-2xl border border-white/20 shadow-lg p-5">
              <p className="text-sm font-semibold text-foreground">Husets status</p>
              <div className="mt-3 space-y-2">
                <div className="animate-pulse bg-zinc-200/60 dark:bg-zinc-800/60 rounded-lg h-5 w-4/5" />
                <div className="animate-pulse bg-zinc-200/60 dark:bg-zinc-800/60 rounded-lg h-5 w-2/5" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </DynamicBackground>
  );
}
