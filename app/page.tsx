import Link from "next/link";
import { logoutAction } from "@/app/actions";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  await requireAdmin();

  const [congregationCount, assignmentCount] = await Promise.all([
    prisma.congregation.count({ where: { isActive: true } }),
    prisma.assignment.count(),
  ]);

  return (
    <main className="app-shell min-h-screen">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 space-y-8">

        {/* ========================================== */}
        {/* 1. STRUCTURAL DASHBOARD HEADER            */}
        {/* ========================================== */}
        <header className="flex items-center justify-between border-b border-[var(--border)] pb-5">
          <div className="space-y-1">
            <h1 className="ui-title text-2xl font-bold tracking-tight">JW Watchnight Scheduler</h1>
            <p className="ui-subtle text-xs">Secure congregation assignment dashboard</p>
          </div>
          <form action={logoutAction}>
            <button className="ui-btn-secondary px-4 py-2 text-sm font-semibold cursor-pointer hover:bg-[var(--background)] transition-colors">
              Sign out
            </button>
          </form>
        </header>

        {/* ========================================== */}
        {/* 2. ANALYTICS / METRICS DISPLAY             */}
        {/* ========================================== */}
        <section className="grid gap-4 sm:grid-cols-2">

          <article className="ui-card p-6 flex flex-col justify-between min-h-[120px]">
            <span className="text-[10px] uppercase font-bold tracking-wider ui-subtle pl-0.5">
              Active Congregations
            </span>
            <p className="ui-title text-4xl font-extrabold tracking-tight mt-2">
              {congregationCount}
            </p>
          </article>

          <article className="ui-card p-6 flex flex-col justify-between min-h-[120px]">
            <span className="text-[10px] uppercase font-bold tracking-wider ui-subtle pl-0.5">
              Total Assignments
            </span>
            <p className="ui-title text-4xl font-extrabold tracking-tight mt-2">
              {assignmentCount}
            </p>
          </article>

        </section>

        {/* ========================================== */}
        {/* 3. NAVIGATION PORTALS                      */}
        {/* ========================================== */}
        <div className="space-y-3">
          <h2 className="text-[10px] uppercase font-bold tracking-wider ui-subtle px-1">
            Management Gateways
          </h2>

          <nav className="grid gap-4 sm:grid-cols-3">

            <Link
              href="/congregations"
              className="ui-card p-5 group transition-all duration-200 hover:border-zinc-400/30 dark:hover:border-zinc-500/30 hover:scale-[1.01] flex flex-col justify-between min-h-[110px]"
            >
              <span className="ui-title font-semibold text-base block group-hover:text-[var(--primary)] transition-colors">
                Manage Congregations
              </span>
              <span className="ui-subtle text-xs block mt-1">
                Update unit profiles, contact info, and meeting schedules.
              </span>
            </Link>

            <Link
              href="/settings"
              className="ui-card p-5 group transition-all duration-200 hover:border-zinc-400/30 dark:hover:border-zinc-500/30 hover:scale-[1.01] flex flex-col justify-between min-h-[110px]"
            >
              <span className="ui-title font-semibold text-base block group-hover:text-[var(--primary)] transition-colors">
                Scheduler Configuration
              </span>
              <span className="ui-subtle text-xs block mt-1">
                Adjust ruleset constraints and program settings.
              </span>
            </Link>

            <Link
              href="/schedule"
              className="ui-card p-5 group transition-all duration-200 hover:border-zinc-400/30 dark:hover:border-zinc-500/30 hover:scale-[1.01] flex flex-col justify-between min-h-[110px]"
            >
              <span className="ui-title font-semibold text-base block group-hover:text-[var(--primary)] transition-colors">
                Assignments & Overrides
              </span>
              <span className="ui-subtle text-xs block mt-1">
                Review output logs, print timetables, or handle manual exceptions.
              </span>
            </Link>

          </nav>
        </div>

      </div>
    </main>
  );
}