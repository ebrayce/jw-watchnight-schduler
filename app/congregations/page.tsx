import Link from "next/link";
import {
  createCongregationAction,
  deleteCongregationAction,
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
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
            Back
          </Link>
          <h1 className="text-2xl font-bold">Congregations</h1>
        </div>
        <form action={logoutAction}>
          <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm">Sign out</button>
        </form>
      </header>

      {params.ok ? <p className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">{params.ok}</p> : null}
      {params.error ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{params.error}</p>
      ) : null}

      <section className="rounded-xl border border-zinc-200 p-4">
        <h2 className="mb-3 text-lg font-semibold">Add Congregation</h2>
        <form action={createCongregationAction} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="name" required placeholder="Name" className="rounded-md border border-zinc-300 px-3 py-2 text-sm" />
            <input
              name="overseer"
              required
              placeholder="Overseer"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              name="contactPrimary"
              required
              placeholder="Primary Contact"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              name="contactAlternate"
              placeholder="Alternative Contact"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
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

          <button type="submit" className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
            Create
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {congregations.map((congregation) => (
          <article key={congregation.id} className="rounded-xl border border-zinc-200 p-4">
            <form action={updateCongregationAction} className="grid gap-3">
              <input type="hidden" name="id" value={congregation.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  name="name"
                  required
                  defaultValue={congregation.name}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  name="overseer"
                  required
                  defaultValue={congregation.overseer}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  name="contactPrimary"
                  required
                  defaultValue={congregation.contactPrimary}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  name="contactAlternate"
                  defaultValue={congregation.contactAlternate ?? ""}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
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
                <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
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

