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
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">JW Watchnight Scheduler</h1>
          <p className="text-sm text-zinc-600">Secure congregation assignment dashboard</p>
        </div>
        <form action={logoutAction}>
          <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm">Sign out</button>
        </form>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-zinc-200 p-4">
          <h2 className="text-sm text-zinc-500">Active Congregations</h2>
          <p className="text-3xl font-semibold">{congregationCount}</p>
        </article>
        <article className="rounded-xl border border-zinc-200 p-4">
          <h2 className="text-sm text-zinc-500">Total Assignments</h2>
          <p className="text-3xl font-semibold">{assignmentCount}</p>
        </article>
      </section>

      <nav className="grid gap-3 sm:grid-cols-3">
        <Link href="/congregations" className="rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50">
          Manage Congregations
        </Link>
        <Link href="/settings" className="rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50">
          Scheduler Configuration
        </Link>
        <Link href="/schedule" className="rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50">
          Assignments & Overrides
        </Link>
      </nav>
    </main>
  );
}
