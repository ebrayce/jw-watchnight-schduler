import Link from "next/link";
import { clearScheduleAction, generateScheduleAction, logoutAction, overrideAssignmentAction } from "@/app/actions";
import { StatusBanner } from "@/components/status-banner";
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
  searchParams: Promise<{ ok?: string; error?: string; tab?: string }>;
};

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  await requireAdmin();
  const params = await searchParams;

  // Default to 'upcoming' view if no tab parameter exists
  const activeTab = params.tab === "audit" ? "audit" : "upcoming";

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
          in: ["SCHEDULE_GENERATED", "ASSIGNMENT_MANUAL_OVERRIDE", "SCHEDULE_CLEARED"],
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
    <main className="app-shell min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 space-y-6">

        {/* ========================================== */}
        {/* 1. STRUCTURAL PAGE HEADER                  */}
        {/* ========================================== */}
        <header className="flex items-center justify-between border-b border-[var(--border)] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link href="/" className="ui-icon-btn inline-flex items-center justify-center">
                ← Home
              </Link>
              <h1 className="text-2xl font-bold tracking-tight ui-title">Schedule & Overrides</h1>
            </div>
            <p className="text-xs ui-subtle">Review automatic chronological assignments or process single-slot calendar overrules.</p>
          </div>
          <form action={logoutAction}>
            <button className="ui-btn-secondary px-4 py-2 text-sm font-semibold cursor-pointer hover:bg-[var(--background)] transition-colors">
              Sign out
            </button>
          </form>
        </header>

        {/* Global Action Banners */}
        {params.ok ? <StatusBanner type="success" message={params.ok} /> : null}
        {params.error ? <StatusBanner type="error" message={params.error} /> : null}

        {/* ========================================== */}
        {/* 2. TWO-COLUMN OPERATIONAL SPLIT LAYOUT     */}
        {/* ========================================== */}
        <div className="grid gap-6 lg:grid-cols-3 items-start">

          {/* LEFT COLUMN: CONTROL & MANAGEMENT PANEL */}
          <div className="space-y-6 lg:col-span-1">

            {/* Action Box: Batch Engine Trigger */}
            <section className="ui-card p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold ui-title">Auto-Generate System</h2>
                <p className="text-xs ui-subtle mt-0.5">
                  Parameters: {settings.assignmentWindowDays} days window • {settings.assignmentsPerDay} target slots daily.
                </p>
              </div>
              <form action={generateScheduleAction}>
                <button type="submit" className="ui-btn w-full py-2.5 text-xs font-bold cursor-pointer shadow-md shadow-[var(--primary)]/10">
                  Generate / Fill Missing Slots
                </button>
              </form>
              <form action={clearScheduleAction}>
                <button type="submit" className="ui-btn-secondary w-full py-2.5 text-xs font-bold cursor-pointer">
                  Clear Schedule (Today+)
                </button>
              </form>
            </section>

            {/* Action Box: Manual Selection Override */}
            <section className="ui-card p-6">
              <h2 className="text-base font-bold ui-title mb-4">Manual Override Form</h2>
              <form action={overrideAssignmentAction} className="space-y-4">

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider ui-subtle pl-1">Target Date</span>
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={toDateInputValue(new Date())}
                    className="ui-input text-sm font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider ui-subtle pl-1">Rotational Slot</span>
                  <select name="slot" className="ui-input text-sm font-medium h-[38px] py-1">
                    {Array.from({ length: settings.assignmentsPerDay }).map((_, index) => (
                      <option key={index} value={index}>
                        Slot {index + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider ui-subtle pl-1">Assigned Congregation</span>
                  <select name="congregationId" required className="ui-input text-sm font-medium h-[38px] py-1">
                    <option value="">Select congregation</option>
                    {congregations.map((congregation) => (
                      <option key={congregation.id} value={congregation.id}>
                        {congregation.name} ({dayLabels[congregation.meetingDays[0]]?.substring(0,3)}, {dayLabels[congregation.meetingDays[1]]?.substring(0,3)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider ui-subtle pl-1">Internal Reference Notes</span>
                  <input name="notes" placeholder="e.g., Circuit Overseer Visit" className="ui-input text-sm" />
                </div>

                <button type="submit" className="ui-btn w-full py-2.5 text-xs font-bold cursor-pointer shadow-md shadow-[var(--primary)]/10">
                  Commit Override Record
                </button>
              </form>
            </section>
          </div>

          {/* RIGHT COLUMN: REVIEWS & LIVE AUDITING (TABBED) */}
          <div className="lg:col-span-2 space-y-4">

            {/* Tab Controller Bar */}
            <div className="flex border-b border-[var(--border)] p-1 gap-2 bg-[var(--surface-strong)] rounded-xl backdrop-blur-sm border">
              <Link
                href="?tab=upcoming"
                scroll={false}
                className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  activeTab === "upcoming"
                    ? "bg-[var(--background)] border border-[var(--border)] ui-title shadow-sm"
                    : "ui-subtle hover:bg-[var(--background)]/40"
                }`}
              >
                📅 Upcoming Calendars
              </Link>
              <Link
                href="?tab=audit"
                scroll={false}
                className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  activeTab === "audit"
                    ? "bg-[var(--background)] border border-[var(--border)] ui-title shadow-sm"
                    : "ui-subtle hover:bg-[var(--background)]/40"
                }`}
              >
                🛡️ Security Audit Trail
              </Link>
            </div>

            {/* TAB PANELS */}
            {activeTab === "upcoming" ? (
              <section className="space-y-3">
                {grouped.size === 0 ? (
                  <div className="ui-card p-12 text-center text-sm ui-subtle">
                    No upcoming slot assignments computed. Trigger the generator loop on the side panel.
                  </div>
                ) : (
                  Array.from(grouped.entries()).map(([date, rows]) => (
                    <article key={date} className="ui-card p-5 transition-all hover:border-zinc-400/20 dark:hover:border-zinc-500/20">
                      <h3 className="font-bold ui-title text-sm border-b border-[var(--border)] pb-2 mb-3">
                        {formatDate(rows[0]?.date ?? new Date(date))}
                      </h3>
                      <div className="space-y-2.5">
                        {rows.map((row) => (
                          <div key={row.id} className="flex flex-wrap items-center justify-between text-sm gap-2">
                            <p className="ui-title">
                              <span className="inline-block min-w-[55px] font-bold text-xs uppercase ui-subtle tracking-wider bg-[var(--surface-strong)] px-2 py-0.5 rounded border border-[var(--border)] mr-2">
                                Slot {row.slot + 1}
                              </span>
                              <strong className="font-semibold">{row.congregation.name}</strong>
                            </p>
                            <div className="flex items-center gap-3">
                              {row.notes && <span className="text-xs italic ui-subtle bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 text-amber-600 dark:text-amber-400">{row.notes}</span>}
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${row.source === 'MANUAL' ? 'bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400' : 'ui-subtle bg-[var(--surface-strong)]'}`}>
                                {row.source}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))
                )}
              </section>
            ) : (
              <section className="space-y-2">
                {auditLogs.length === 0 ? (
                  <p className="text-sm ui-subtle p-4">No audit events logged in this instance environment.</p>
                ) : (
                  auditLogs.map((event) => {
                    const details = event.details as {
                      created?: number;
                      removed?: number;
                      fromDate?: string;
                      conflicts?: Array<{ date: string; slot: number; reason: string }>;
                      slot?: number;
                      date?: string;
                    } | null;

                    const isGenerated = event.eventType === "SCHEDULE_GENERATED";
                    const isCleared = event.eventType === "SCHEDULE_CLEARED";

                    return (
                      <article key={event.id} className="ui-card p-4 text-xs flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-bold ui-title">
                            {isGenerated
                              ? "⚙️ SYSTEM_BATCH_GENERATE"
                              : isCleared
                                ? "🧹 SCHEDULE_CLEARED"
                                : "✍️ MANUAL_OVERRIDE_APPLIED"}
                          </p>
                          {isGenerated ? (
                            <p className="ui-subtle">
                              Created <span className="font-semibold ui-title">{details?.created ?? 0}</span> new matching data instances
                              {details?.conflicts?.length ? ` • detected structural timeline context breaks: ${details.conflicts.length}` : ""}.
                            </p>
                          ) : isCleared ? (
                            <p className="ui-subtle">
                              Cleared <span className="font-semibold ui-title">{details?.removed ?? 0}</span> assignment(s)
                              from <span className="font-semibold ui-title">{details?.fromDate?.slice(0, 10) ?? "today"}</span> onward.
                            </p>
                          ) : (
                            <p className="ui-subtle">
                              Forced target pointer alteration for date <span className="font-semibold ui-title">{details?.date?.slice(0, 10) ?? "unknown"}</span>, positioned execution sequence index at <span className="font-semibold ui-title">Slot {(details?.slot ?? 0) + 1}</span>.
                            </p>
                          )}
                        </div>
                        <span className="ui-subtle font-medium shrink-0 whitespace-nowrap">
                          {formatDate(new Date(event.createdAt))}
                        </span>
                      </article>
                    );
                  })
                )}
              </section>
            )}

          </div>

        </div>
      </div>
    </main>
  );
}