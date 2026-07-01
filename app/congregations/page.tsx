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
    <div className="grid grid-cols-4 gap-1.5 rounded-lg bg-[var(--background)] p-1.5">
      {weekdays.map((day) => {
        const isChecked = selected.includes(day);
        return (
          <label
            key={`${inputName}-${day}`}
            className="flex flex-col items-center justify-center rounded-md border border-transparent p-2 text-center transition-all has-[:checked]:border-brand-accent/20 has-[:checked]:bg-white dark:has-[:checked]:bg-zinc-900 cursor-pointer"
          >
            <input
              type="checkbox"
              name={inputName}
              value={day}
              defaultChecked={isChecked}
              className="sr-only" /* Hidden native checkbox for clean button style */
            />
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-muted">
              {dayLabels[day].substring(0, 3)}
            </span>
          </label>
        );
      })}
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
    <main className="app-shell min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 space-y-6">

        {/* ========================================== */}
        {/* 1. STRUCTURAL HEADER                       */}
        {/* ========================================== */}
        <header className="flex items-center justify-between border-b border-brand-muted/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link href="/" className="btn-outline px-3 py-1.5 text-xs">
                ← Home
              </Link>
              <h1 className="text-2xl font-bold tracking-tight text-brand-deep">Congregations</h1>
            </div>
            <p className="text-xs text-brand-muted">Manage directory records, meeting schedules, and data records.</p>
          </div>
          <form action={logoutAction}>
            <button className="btn-outline px-4 py-2 text-sm font-medium">Sign out</button>
          </form>
        </header>

        {/* Global Action Banner Placement */}
        {params.ok && <p className="ui-alert-success px-4 py-3 text-sm rounded-xl font-medium">{params.ok}</p>}
        {params.error && <p className="ui-alert-error px-4 py-3 text-sm rounded-xl font-medium">{params.error}</p>}

        {/* ========================================== */}
        {/* 2. TWO-COLUMN SPLIT LAYOUT                 */}
        {/* ========================================== */}
        <div className="grid gap-6 lg:grid-cols-3 items-start">

          {/* SIDEBAR: Creation & Tool Panes */}
          <div className="space-y-6 lg:col-span-1">

            {/* Action Pane: Create */}
            <section className="card p-6">
              <h2 className="text-base font-bold text-brand-deep mb-4">Add New Unit</h2>
              <form action={createCongregationAction} className="space-y-4">
                <div className="space-y-3">
                  <input name="name" required placeholder="Congregation Name" className="ui-input w-full text-sm" />
                  <input name="overseer" required placeholder="Overseer Name" className="ui-input w-full text-sm" />
                  <input name="contactPrimary" required placeholder="Primary Contact Phone" className="ui-input w-full text-sm" />
                  <input name="contactAlternate" placeholder="Alternative Contact Phone (Optional)" className="ui-input w-full text-sm" />
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Meeting Days</p>
                  <MeetingDayPicker selected={[]} inputName="meetingDays" />
                </div>

                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer py-1 text-brand-deep">
                  <input type="checkbox" name="isActive" defaultChecked className="rounded text-brand-accent focus:ring-brand-accent/20" />
                  Active
                </label>

                <button type="submit" className="btn-primary w-full py-2.5 text-sm">
                  Add Congregation
                </button>
              </form>
            </section>

            {/* Action Pane: Bulk Imports */}
            <section className="card p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold text-brand-deep">Data Sync</h2>
                <p className="text-xs text-brand-muted">Import or export records matching native schemas.</p>
              </div>

              <form action={importCongregationsCsvAction} className="space-y-2 pt-2 border-t border-brand-muted/10">
                <label className="block text-xs font-semibold text-brand-muted uppercase">Import via Csv</label>
                <input
                  type="file"
                  name="csvFile"
                  accept=".csv,text/csv"
                  required
                  className="w-full text-xs text-brand-muted file:mr-3 file:rounded-md file:border file:border-brand-muted/20 file:bg-transparent file:px-2.5 file:py-1.5 file:text-xs file:font-semibold cursor-pointer"
                />
                <button type="submit" className="btn-outline w-full py-2 text-xs">
                  Upload CSV
                </button>
              </form>

              <div className="pt-3 border-t border-brand-muted/10">
                <a
                  href="/api/congregations/export"
                  className="btn-outline block text-center py-2 text-xs"
                >
                  Download Active Directory Backup (CSV)
                </a>
              </div>
            </section>
          </div>

          {/* MAIN WORKSPACE: Records Stream */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-base font-bold text-brand-deep">All Congregations ({congregations.length})</h2>
              <span className="text-xs text-brand-muted">Alphabetical order</span>
            </div>

            {congregations.length === 0 ? (
              <div className="card p-12 text-center text-sm text-brand-muted">
                No congregation records found. Use the sidebar generator to add records.
              </div>
            ) : (
              congregations.map((congregation) => (
                <article key={congregation.id} className="card p-6 transition-all hover:border-brand-muted/20">
                  <form action={updateCongregationAction} className="space-y-4">
                    <input type="hidden" name="id" value={congregation.id} />

                    {/* Inline Responsive Grid */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-brand-muted block pl-1">Unit Name</span>
                        <input name="name" required defaultValue={congregation.name} className="ui-input w-full text-sm font-medium text-brand-deep" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-brand-muted block pl-1">Overseer</span>
                        <input name="overseer" required defaultValue={congregation.overseer} className="ui-input w-full text-sm" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-brand-muted block pl-1">Primary Phone Number</span>
                        <input name="contactPrimary" required defaultValue={congregation.contactPrimary} className="ui-input w-full text-sm" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-brand-muted block pl-1">Second Phone Number</span>
                        <input name="contactAlternate" defaultValue={congregation.contactAlternate ?? ""} className="ui-input w-full text-sm" />
                      </div>
                    </div>

                    {/* Schedule Picker Placement */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-brand-muted block pl-1">Meeting Days</span>
                      <MeetingDayPicker selected={congregation.meetingDays} inputName="meetingDays" />
                    </div>

                    {/* Footer Utility Row */}
                    <div className="flex items-center justify-between border-t border-brand-muted/5 pt-3 mt-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-brand-muted cursor-pointer">
                        <input type="checkbox" name="isActive" defaultChecked={congregation.isActive} className="rounded text-brand-accent focus:ring-brand-accent/10" />
                        Active
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          formAction={deleteCongregationAction}
                          formMethod="post"
                          className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/5"
                        >
                          Remove
                        </button>
                        <button type="submit" className="btn-primary px-5 py-2 text-xs">
                          Save
                        </button>
                      </div>
                    </div>
                  </form>
                </article>
              ))
            )}
          </section>

        </div>
      </div>
    </main>
  );
}