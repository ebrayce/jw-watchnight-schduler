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
    <main className="app-shell mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-deep">JW Watchnight Scheduler</h1>
          <p className="text-sm text-brand-muted">Secure congregation assignment dashboard</p>
        </div>
        <form action={logoutAction}>
          <button className="btn-outline rounded-md px-3 py-2 text-sm">Sign out</button>
        </form>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="card rounded-xl p-4">
          <h2 className="text-sm text-brand-muted">Active Congregations</h2>
          <p className="text-3xl font-semibold text-brand-deep">{congregationCount}</p>
        </article>
        <article className="card rounded-xl p-4">
          <h2 className="text-sm text-brand-muted">Total Assignments</h2>
          <p className="text-3xl font-semibold text-brand-deep">{assignmentCount}</p>
        </article>
      </section>

      <nav className="grid gap-3 sm:grid-cols-3">
        <Link href="/congregations" className="card rounded-xl p-4 transition hover:-translate-y-0.5 hover:bg-brand-soft/20">
          Manage Congregations
        </Link>
        <Link href="/settings" className="card rounded-xl p-4 transition hover:-translate-y-0.5 hover:bg-brand-accent/15">
          Scheduler Configuration
        </Link>
        <Link href="/schedule" className="card rounded-xl p-4 transition hover:-translate-y-0.5 hover:bg-brand-warm/25">
          Assignments & Overrides
        </Link>
      </nav>
    </main>
  );
}
