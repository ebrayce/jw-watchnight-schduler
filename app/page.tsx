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
          <h1 className="ui-title text-2xl font-bold">JW Watchnight Scheduler</h1>
          <p className="ui-subtle text-sm">Secure congregation assignment dashboard</p>
        </div>
        <form action={logoutAction}>
          <button className="ui-btn-secondary px-3 py-2 text-sm">Sign out</button>
        </form>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="ui-card p-5 shadow-sm">
          <h2 className="ui-subtle text-sm">Active Congregations</h2>
          <p className="ui-title text-3xl font-semibold">{congregationCount}</p>
        </article>
        <article className="ui-card p-5 shadow-sm">
          <h2 className="ui-subtle text-sm">Total Assignments</h2>
          <p className="ui-title text-3xl font-semibold">{assignmentCount}</p>
        </article>
      </section>

      <nav className="grid gap-3 sm:grid-cols-3">
        <Link href="/congregations" className="ui-card p-4 transition hover:-translate-y-0.5">
          Manage Congregations
        </Link>
        <Link href="/settings" className="ui-card p-4 transition hover:-translate-y-0.5">
          Scheduler Configuration
        </Link>
        <Link href="/schedule" className="ui-card p-4 transition hover:-translate-y-0.5">
          Assignments & Overrides
        </Link>
      </nav>
    </main>
  );
}
