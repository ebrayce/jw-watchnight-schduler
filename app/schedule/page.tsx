import Link from "next/link";
import { generateScheduleAction, logoutAction, overrideAssignmentAction } from "@/app/actions";
import { dayLabels, formatDateKey, toDateInputValue } from "@/lib/dates";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    weekday: "short",
  }).format(value);
}

type SchedulePageProps = {
  searchParams: Promise<{ ok?: string; error?: string }>;
};

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  await requireAdmin();
  const params = await searchParams;

  const [config, congregations, assignments, auditLogs] = await Promise.all([
    prisma.schedulerConfig.findUnique({ where: { id: 1 } }),
    prisma.congregation.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.assignment.findMany({
      include: { congregation: true },
      orderBy: [{ date: "asc" }, { slot: "asc" }],
      take: 200,
    }),
    prisma.auditLog.findMany({
      where: {
        eventType: {
          in: ["SCHEDULE_GENERATED", "ASSIGNMENT_MANUAL_OVERRIDE"],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const settings =
    config ??
    (await prisma.schedulerConfig.create({
      data: { id: 1 },
    }));

  const grouped = assignments.reduce(
    (acc, assignment) => {
      const key = formatDateKey(assignment.date);
      const current = acc.get(key) ?? [];
      current.push(assignment);
      acc.set(key, current);
      return acc;
    },
    new Map<string, typeof assignments>(),
  );

  return (
    <main className="app-shell mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="ui-btn-secondary px-3 py-2 text-sm">
            Back
          </Link>
          <h1 className="ui-title text-2xl font-bold">Schedule & Overrides</h1>
        </div>
        <form action={logoutAction}>
          <button className="ui-btn-secondary px-3 py-2 text-sm">Sign out</button>
        </form>
      </header>

      <section className="ui-card p-5 shadow-sm">
        {params.ok ? (
          <p className="ui-alert-success mb-3 px-3 py-2 text-sm">{params.ok}</p>
        ) : null}
        {params.error ? (
          <p className="ui-alert-error mb-3 px-3 py-2 text-sm">{params.error}</p>
        ) : null}

        <h2 className="text-lg font-semibold">Auto-generate Assignments</h2>
        <p className="ui-subtle mt-1 text-sm">
          Window: {settings.assignmentWindowDays} days, {settings.assignmentsPerDay} assignment(s) per day.
        </p>
        <form action={generateScheduleAction} className="mt-3">
          <button type="submit" className="ui-btn px-4 py-2 text-sm font-semibold">
            Generate / Fill Missing Slots
          </button>
        </form>
      </section>

      <section className="ui-card p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Manual Override</h2>
        <form action={overrideAssignmentAction} className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium">Date</span>
            <input
              name="date"
              type="date"
              required
              defaultValue={toDateInputValue(new Date())}
              className="ui-input text-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">Slot</span>
            <select name="slot" className="ui-input text-sm">
              {Array.from({ length: settings.assignmentsPerDay }).map((_, index) => (
                <option key={index} value={index}>
                  Slot {index + 1}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium">Congregation</span>
            <select name="congregationId" required className="ui-input text-sm">
              <option value="">Select congregation</option>
              {congregations.map((congregation) => (
                <option key={congregation.id} value={congregation.id}>
                  {congregation.name} ({dayLabels[congregation.meetingDays[0]]}, {dayLabels[congregation.meetingDays[1]]})
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium">Notes (optional)</span>
            <input name="notes" className="ui-input text-sm" />
          </label>

          <button type="submit" className="ui-btn w-fit px-4 py-2 text-sm font-semibold">
            Save Override
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Upcoming Assignments</h2>
        {Array.from(grouped.entries()).map(([date, rows]) => (
          <article key={date} className="ui-card p-5 shadow-sm">
            <h3 className="font-semibold">{formatDate(rows[0]?.date ?? new Date(date))}</h3>
            <div className="mt-2 space-y-1 text-sm">
              {rows.map((row) => (
                <p key={row.id}>
                  Slot {row.slot + 1}: <strong>{row.congregation.name}</strong> ({row.source})
                  {row.notes ? ` - ${row.notes}` : ""}
                </p>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Audit Log</h2>
        {auditLogs.length === 0 ? <p className="text-sm text-zinc-600">No audit events yet.</p> : null}
        {auditLogs.map((event) => {
          const details = event.details as
            | {
                created?: number;
                conflicts?: Array<{ date: string; slot: number; reason: string }>;
                slot?: number;
                date?: string;
              }
            | null;

          return (
            <article key={event.id} className="ui-card p-5 text-sm shadow-sm">
              <p className="font-semibold">
                {event.eventType} - {formatDate(new Date(event.createdAt))}
              </p>
              {event.eventType === "SCHEDULE_GENERATED" ? (
                <p className="mt-1 text-zinc-700">
                  Created {details?.created ?? 0} assignment(s)
                  {details?.conflicts?.length ? `, conflicts: ${details.conflicts.length}` : ""}.
                </p>
              ) : (
                <p className="mt-1 text-zinc-700">
                  Manual override for {details?.date?.slice(0, 10) ?? "unknown date"}, slot
                  {(details?.slot ?? 0) + 1}.
                </p>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}

