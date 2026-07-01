import Link from "next/link";
import {
  createCongregationAction,
  deleteCongregationAction,
  importCongregationsCsvAction,
  logoutAction,
  updateCongregationAction,
} from "@/app/actions";
import { dayLabels } from "@/lib/dates";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const weekdays = [0, 1, 2, 3, 4, 5, 6] as const;

function MeetingDayPicker({ selected, inputName }: { selected: number[]; inputName: string }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {weekdays.map((day) => (
        <label key={`${inputName}-${day}`} className="flex items-center gap-2 text-xs">
          <input type="checkbox" name={inputName} value={day} defaultChecked={selected.includes(day)} />
          <span>{dayLabels[day]}</span>
        </label>
      ))}
    </div>
  );
}

type CongregationsPageProps = {
  searchParams: Promise<{ ok?: string; error?: string }>;
};

export default async function CongregationsPage({ searchParams }: CongregationsPageProps) {
  await requireAdmin();
  const params = await searchParams;

  const congregations = await prisma.congregation.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <main className="app-shell mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="btn-outline rounded-md px-3 py-2 text-sm">
            Back
          </Link>
          <h1 className="text-2xl font-bold text-brand-deep">Congregations</h1>
        </div>
        <form action={logoutAction}>
          <button className="btn-outline rounded-md px-3 py-2 text-sm">Sign out</button>
        </form>
      </header>

      {params.ok ? <p className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">{params.ok}</p> : null}
      {params.error ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{params.error}</p>
      ) : null}

      <section className="card rounded-xl p-4">
        <h2 className="mb-3 text-lg font-semibold">CSV Import / Export</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <form action={importCongregationsCsvAction} className="space-y-2 rounded-md border border-brand-accent/30 bg-white/70 p-3">
            <p className="text-sm font-medium">Import Congregations CSV</p>
            <input
              type="file"
              name="csvFile"
              accept=".csv,text/csv"
              required
              className="w-full text-sm file:mr-3 file:rounded-md file:border file:border-brand-accent/40 file:bg-brand-soft/15 file:px-3 file:py-2"
            />
            <p className="text-xs text-zinc-600">
              Header: name,overseer,contactPrimary,contactAlternate,meetingDay1,meetingDay2,isActive
            </p>
            <button type="submit" className="btn-primary rounded-md px-3 py-2 text-sm font-semibold">
              Import CSV
            </button>
          </form>

          <div className="space-y-2 rounded-md border border-brand-accent/30 bg-white/70 p-3">
            <p className="text-sm font-medium">Export Congregations CSV</p>
            <p className="text-xs text-zinc-600">Downloads all congregations in the same import format.</p>
            <a
              href="/api/congregations/export"
              className="btn-outline inline-block rounded-md px-3 py-2 text-sm font-medium"
            >
              Export CSV
            </a>
          </div>
        </div>
      </section>

      <section className="card rounded-xl p-4">
        <h2 className="mb-3 text-lg font-semibold">Add Congregation</h2>
        <form action={createCongregationAction} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="name" required placeholder="Name" className="rounded-md border border-brand-accent/50 bg-white px-3 py-2 text-sm focus:border-brand-accent focus:outline-none" />
            <input
              name="overseer"
              required
              placeholder="Overseer"
              className="rounded-md border border-brand-accent/50 bg-white px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
            />
            <input
              name="contactPrimary"
              required
              placeholder="Primary Contact"
              className="rounded-md border border-brand-accent/50 bg-white px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
            />
            <input
              name="contactAlternate"
              placeholder="Alternative Contact"
              className="rounded-md border border-brand-accent/50 bg-white px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
            />
          </div>

          <div>
            <p className="mb-1 text-sm font-medium">Meeting days (pick exactly 2)</p>
            <MeetingDayPicker selected={[]} inputName="meetingDays" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked />
            Active
          </label>

          <button type="submit" className="btn-primary w-fit rounded-md px-4 py-2 text-sm font-semibold">
            Create
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {congregations.map((congregation) => (
          <article key={congregation.id} className="card rounded-xl p-4">
            <form action={updateCongregationAction} className="grid gap-3">
              <input type="hidden" name="id" value={congregation.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  name="name"
                  required
                  defaultValue={congregation.name}
                  className="rounded-md border border-brand-accent/50 bg-white px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
                />
                <input
                  name="overseer"
                  required
                  defaultValue={congregation.overseer}
                  className="rounded-md border border-brand-accent/50 bg-white px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
                />
                <input
                  name="contactPrimary"
                  required
                  defaultValue={congregation.contactPrimary}
                  className="rounded-md border border-brand-accent/50 bg-white px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
                />
                <input
                  name="contactAlternate"
                  defaultValue={congregation.contactAlternate ?? ""}
                  className="rounded-md border border-brand-accent/50 bg-white px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
                />
              </div>

              <div>
                <p className="mb-1 text-sm font-medium">Meeting days (pick exactly 2)</p>
                <MeetingDayPicker selected={congregation.meetingDays} inputName="meetingDays" />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isActive" defaultChecked={congregation.isActive} />
                Active
              </label>

              <div className="flex gap-2">
                <button type="submit" className="btn-primary rounded-md px-4 py-2 text-sm font-semibold">
                  Save
                </button>
                <button
                  type="submit"
                  formAction={deleteCongregationAction}
                  formMethod="post"
                  className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700"
                >
                  Delete
                </button>
              </div>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}

