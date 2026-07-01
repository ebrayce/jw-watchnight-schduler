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
    <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-1.5 backdrop-blur-sm">
      {weekdays.map((day) => {
        const isChecked = selected.includes(day);
        return (
          <label
            key={`${inputName}-${day}`}
            className="flex flex-col items-center justify-center rounded-lg border border-transparent p-2 text-center transition-all has-[:checked]:border-[var(--primary)]/30 has-[:checked]:bg-[var(--background)] cursor-pointer"
          >
            <input
              type="checkbox"
              name={inputName}
              value={day}
              defaultChecked={isChecked}
              className="sr-only" /* Hidden native checkbox */
            />
            <span className="text-[10px] uppercase font-bold tracking-wider ui-subtle">
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
    <main className="app-shell w-full min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 space-y-6">

        {/* ========================================== */}
        {/* 1. APPLICATION HEADER                      */}
        {/* ========================================== */}
        <header className="flex items-center justify-between border-b border-[var(--border)] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link href="/" className="ui-icon-btn inline-flex items-center justify-center">
                ← Home
              </Link>
              <h1 className="text-2xl font-bold tracking-tight ui-title">Congregations</h1>
            </div>
            <p className="text-xs ui-subtle">Manage directory records, meeting schedules, and data records.</p>
          </div>
          <form action={logoutAction}>
            <button className="ui-btn-secondary px-4 py-2 text-sm font-semibold cursor-pointer hover:bg-[var(--background)] transition-colors">
              Sign out
            </button>
          </form>
        </header>

        {/* System Notification Banners */}
        {params.ok && <p className="ui-alert-success px-4 py-3 text-sm font-medium">{params.ok}</p>}
        {params.error && <p className="ui-alert-error px-4 py-3 text-sm font-medium">{params.error}</p>}

        {/* ========================================== */}
        {/* 2. PERSISTENT GRID ARCHITECTURE            */}
        {/* ========================================== */}
        <div className="grid gap-6 lg:grid-cols-3 items-start">

          {/* SIDEBAR MODULES */}
          <div className="space-y-6 lg:col-span-1">

            {/* Panel: Write Registry */}
            <section className="ui-card p-6">
              <h2 className="text-base font-bold ui-title mb-4">Add New Congregation</h2>
              <form action={createCongregationAction} className="space-y-4">
                <div className="space-y-3">
                  <input name="name" required placeholder="Congregation Name" className="ui-input text-sm" />
                  <input name="overseer" required placeholder="Overseer Name" className="ui-input text-sm" />
                  <input name="contactPrimary" required placeholder="Primary Contact Phone" className="ui-input text-sm" />
                  <input name="contactAlternate" placeholder="Alternative Contact (Optional)" className="ui-input text-sm" />
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider ui-subtle pl-0.5">Meeting Days</p>
                  <MeetingDayPicker selected={[]} inputName="meetingDays" />
                </div>

                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer py-1 ui-title">
                  <input type="checkbox" name="isActive" defaultChecked className="rounded border-[var(--border)] bg-[var(--surface-strong)] text-[var(--primary)] focus:ring-[var(--primary)]/20" />
                  Active Listing
                </label>

                <button type="submit" className="ui-btn w-full py-2.5 text-sm font-semibold cursor-pointer shadow-md shadow-[var(--primary)]/10">
                  Add Congregation
                </button>
              </form>
            </section>

            {/* Panel: Bulk Processing */}
            <section className="ui-card p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold ui-title">Data Sync</h2>
                <p className="text-xs ui-subtle">Import or export records matching standard CSV patterns.</p>
              </div>

              <form action={importCongregationsCsvAction} className="space-y-2 pt-2 border-t border-[var(--border)]">
                <label className="block text-xs font-semibold ui-subtle uppercase">Import via CSV</label>
                <input
                  type="file"
                  name="csvFile"
                  accept=".csv,text/csv"
                  required
                  className="w-full text-xs ui-subtle file:mr-3 file:rounded-lg file:border file:border-[var(--border)] file:bg-[var(--surface-strong)] file:px-2.5 file:py-1.5 file:text-xs file:font-semibold cursor-pointer"
                />
                <button type="submit" className="ui-btn-secondary w-full py-2 text-xs font-semibold cursor-pointer hover:bg-[var(--background)] transition-colors">
                  Upload Data File
                </button>
              </form>

              <div className="pt-3 border-t border-[var(--border)]">
                <a
                  href="/api/congregations/export"
                  className="ui-btn-secondary block text-center py-2 text-xs font-semibold hover:bg-[var(--background)] transition-colors"
                >
                  Download Backup (CSV)
                </a>
              </div>
            </section>
          </div>

          {/* MAIN RECORD VIEWS */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-base font-bold ui-title">Active Congregations ({congregations.length})</h2>
              <span className="text-xs ui-subtle">Alphabetical layout</span>
            </div>

            {congregations.length === 0 ? (
              <div className="ui-card p-12 text-center text-sm ui-subtle">
                No records established. Use the generation pane to add data.
              </div>
            ) : (
              congregations.map((congregation) => (
                <article key={congregation.id} className="ui-card p-6 transition-all hover:border-zinc-400/30 dark:hover:border-zinc-500/30 shadow-sm">
                  <form action={updateCongregationAction} className="space-y-4">
                    <input type="hidden" name="id" value={congregation.id} />

                    {/* Uniform Responsive Forms Grid */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider ui-subtle block pl-1"> Name</span>
                        <input name="name" required defaultValue={congregation.name} className="ui-input text-sm font-semibold" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider ui-subtle block pl-1">Overseer</span>
                        <input name="overseer" required defaultValue={congregation.overseer} className="ui-input text-sm" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider ui-subtle block pl-1">Primary Phone Number</span>
                        <input name="contactPrimary" required defaultValue={congregation.contactPrimary} className="ui-input text-sm" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider ui-subtle block pl-1">Second Phone Number</span>
                        <input name="contactAlternate" defaultValue={congregation.contactAlternate ?? ""} className="ui-input text-sm" />
                      </div>
                    </div>

                    {/* Schedule Picker Placement */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider ui-subtle block pl-1">Meeting Days</span>
                      <MeetingDayPicker selected={congregation.meetingDays} inputName="meetingDays" />
                    </div>

                    {/* Footer Utility Actions */}
                    <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 mt-2">
                      <label className="flex items-center gap-2 text-xs font-semibold ui-subtle cursor-pointer">
                        <input type="checkbox" name="isActive" defaultChecked={congregation.isActive} className="rounded border-[var(--border)] bg-[var(--surface-strong)] text-[var(--primary)] focus:ring-[var(--primary)]/10" />
                        Active Status
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          formAction={deleteCongregationAction}
                          formMethod="post"
                          className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors px-3 py-2 rounded-xl hover:bg-red-500/10 cursor-pointer"
                        >
                          Remove Cong
                        </button>
                        <button type="submit" className="ui-btn px-6 py-2 text-xs font-semibold cursor-pointer shadow-md shadow-[var(--primary)]/5">
                          Save Changes
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