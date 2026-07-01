import Link from "next/link";
import { logoutAction, updateSchedulerConfigAction } from "@/app/actions";
import { dayLabels } from "@/lib/dates";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

type SettingsPageProps = {
  searchParams: Promise<{ ok?: string; error?: string }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  await requireAdmin();
  const params = await searchParams;

  const config =
    (await prisma.schedulerConfig.findUnique({ where: { id: 1 } })) ??
    (await prisma.schedulerConfig.create({
      data: {
        id: 1,
      },
    }));

  return (
    <main className="app-shell mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="ui-btn-secondary px-3 py-2 text-sm">
            Back
          </Link>
          <h1 className="ui-title text-2xl font-bold">Scheduler Settings</h1>
        </div>
        <form action={logoutAction}>
          <button className="ui-btn-secondary px-3 py-2 text-sm">Sign out</button>
        </form>
      </header>

      <form action={updateSchedulerConfigAction} className="ui-card space-y-4 p-5 shadow-sm">
        {params.ok ? (
          <p className="ui-alert-success px-3 py-2 text-sm">{params.ok}</p>
        ) : null}
        {params.error ? (
          <p className="ui-alert-error px-3 py-2 text-sm">{params.error}</p>
        ) : null}

        <label className="block space-y-1">
          <span className="text-sm font-medium">Assignment window (days ahead)</span>
          <input
            type="number"
            name="assignmentWindowDays"
            min={7}
            max={365}
            defaultValue={config.assignmentWindowDays}
            className="ui-input text-sm"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Assignments per day</span>
          <input
            type="number"
            name="assignmentsPerDay"
            min={1}
            max={3}
            defaultValue={config.assignmentsPerDay}
            className="ui-input text-sm"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Week starts on</span>
          <select
            name="weekStartsOn"
            defaultValue={String(config.weekStartsOn)}
            className="ui-input text-sm"
          >
            {Object.entries(dayLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="avoidConsecutiveDays" defaultChecked={config.avoidConsecutiveDays} />
          Avoid assigning the same congregation on consecutive days
        </label>

        <button type="submit" className="ui-btn px-4 py-2 text-sm font-semibold">
          Save Settings
        </button>
      </form>
    </main>
  );
}

