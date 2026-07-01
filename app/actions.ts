"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { type Prisma } from "@prisma/client";
import { parseCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import { createAdminSession, clearAdminSession, isAdminAuthenticated, verifyPassword } from "@/lib/auth";
import { generateAssignments } from "@/lib/scheduler";
import {
  assignmentOverrideSchema,
  congregationInputSchema,
  parseFormData,
  schedulerConfigInputSchema,
} from "@/lib/validation";

async function assertAdmin(): Promise<void> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/login");
  }
}

function redirectWithStatus(path: string, params: { ok?: string; error?: string }): never {
  const search = new URLSearchParams();
  if (params.ok) {
    search.set("ok", params.ok);
  }
  if (params.error) {
    search.set("error", params.error);
  }
  redirect(`${path}?${search.toString()}`);
}

async function createAuditLog(eventType: string, details?: Prisma.InputJsonValue): Promise<void> {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");

  await prisma.auditLog.create({
    data: {
      eventType,
      actor: "admin",
      ipAddress: forwardedFor?.split(",")[0]?.trim() ?? null,
      userAgent: headerStore.get("user-agent"),
      details,
    },
  });
}

export async function loginAction(formData: FormData): Promise<void> {
  const password = String(formData.get("password") ?? "");
  if (!verifyPassword(password)) {
    redirect("/login?error=invalid");
  }

  await createAdminSession();
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await clearAdminSession();
  redirect("/login");
}

export async function createCongregationAction(formData: FormData): Promise<void> {
  await assertAdmin();

  const input = parseFormData(formData);
  const parsed = congregationInputSchema.safeParse({
    ...input,
    contactAlternate: input.contactAlternate ? String(input.contactAlternate) : undefined,
  });

  if (!parsed.success) {
    redirectWithStatus("/congregations", {
      error: parsed.error.issues[0]?.message ?? "Invalid congregation data.",
    });
  }

  try {
    await prisma.congregation.create({
      data: parsed.data,
    });
    revalidatePath("/congregations");
    revalidatePath("/");
    redirectWithStatus("/congregations", { ok: "Congregation created." });
  } catch {
    redirectWithStatus("/congregations", {
      error: "Could not create congregation. Name must be unique.",
    });
  }
}

export async function updateCongregationAction(formData: FormData): Promise<void> {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  const input = parseFormData(formData);
  const parsed = congregationInputSchema.safeParse({
    ...input,
    contactAlternate: input.contactAlternate ? String(input.contactAlternate) : undefined,
  });

  if (!id) {
    redirectWithStatus("/congregations", { error: "Missing congregation id." });
  }

  if (!parsed.success) {
    redirectWithStatus("/congregations", {
      error: parsed.error.issues[0]?.message ?? "Invalid congregation data.",
    });
  }

  try {
    await prisma.congregation.update({
      where: { id },
      data: parsed.data,
    });
    revalidatePath("/congregations");
    redirectWithStatus("/congregations", { ok: "Congregation updated." });
  } catch {
    redirectWithStatus("/congregations", { error: "Could not update congregation." });
  }
}

export async function deleteCongregationAction(formData: FormData): Promise<void> {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    redirectWithStatus("/congregations", { error: "Missing congregation id." });
  }

  try {
    const assignmentCount = await prisma.assignment.count({
      where: { congregationId: id },
    });

    if (assignmentCount > 0) {
      await prisma.congregation.update({
        where: { id },
        data: { isActive: false },
      });

      revalidatePath("/congregations");
      revalidatePath("/schedule");
      redirectWithStatus("/congregations", {
        ok: `Congregation archived (inactive). It has ${assignmentCount} linked assignment(s), so it was not hard-deleted.`,
      });
    }

    await prisma.congregation.delete({ where: { id } });
    revalidatePath("/congregations");
    revalidatePath("/schedule");
    redirectWithStatus("/congregations", { ok: "Congregation deleted." });
  } catch {
    redirectWithStatus("/congregations", {
      error: "Could not delete congregation. Ensure no assignment references it.",
    });
  }
}

function parseCsvBoolean(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function parseCsvMeetingDay(value: string): number {
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 6) {
    throw new Error(`Invalid meeting day '${value}'. Use 0-6.`);
  }
  return parsed;
}

export async function importCongregationsCsvAction(formData: FormData): Promise<void> {
  await assertAdmin();

  const csvFile = formData.get("csvFile");
  if (!(csvFile instanceof File)) {
    redirectWithStatus("/congregations", { error: "Please upload a CSV file." });
  }

  if (csvFile.size > 1_000_000) {
    redirectWithStatus("/congregations", { error: "CSV file too large. Limit is 1MB." });
  }

  const content = await csvFile.text();
  const rows = parseCsv(content);
  if (rows.length === 0) {
    redirectWithStatus("/congregations", { error: "CSV is empty." });
  }

  const [header, ...dataRows] = rows;
  const expectedHeader = [
    "name",
    "overseer",
    "contactPrimary",
    "contactAlternate",
    "meetingDay1",
    "meetingDay2",
    "isActive",
  ];

  const headerValid = expectedHeader.every((key, index) => header?.[index]?.trim() === key);
  if (!headerValid) {
    redirectWithStatus("/congregations", {
      error: `Invalid CSV header. Expected: ${expectedHeader.join(",")}`,
    });
  }

  let upserted = 0;
  const rowErrors: string[] = [];

  for (let index = 0; index < dataRows.length; index += 1) {
    const row = dataRows[index] ?? [];
    if (row.length === 0 || row.every((value) => value.trim().length === 0)) {
      continue;
    }

    try {
      const rowData = {
        name: row[0]?.trim() ?? "",
        overseer: row[1]?.trim() ?? "",
        contactPrimary: row[2]?.trim() ?? "",
        contactAlternate: row[3]?.trim() || undefined,
        meetingDays: [parseCsvMeetingDay(row[4] ?? ""), parseCsvMeetingDay(row[5] ?? "")],
        isActive: parseCsvBoolean(row[6] ?? "true"),
      };

      const parsed = congregationInputSchema.parse(rowData);
      await prisma.congregation.upsert({
        where: { name: parsed.name },
        create: parsed,
        update: parsed,
      });
      upserted += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown row error";
      rowErrors.push(`row ${index + 2}: ${message}`);
    }
  }

  await createAuditLog("CONGREGATION_CSV_IMPORT", {
    imported: upserted,
    failed: rowErrors.length,
    errors: rowErrors.slice(0, 10),
  });

  revalidatePath("/congregations");
  revalidatePath("/");

  if (rowErrors.length > 0) {
    redirectWithStatus("/congregations", {
      ok: `Imported ${upserted} rows with ${rowErrors.length} row error(s). First: ${rowErrors[0]}`,
    });
  }

  redirectWithStatus("/congregations", { ok: `Imported ${upserted} congregation row(s).` });
}

export async function updateSchedulerConfigAction(formData: FormData): Promise<void> {
  await assertAdmin();

  const input = parseFormData(formData);
  const parsed = schedulerConfigInputSchema.safeParse(input);

  if (!parsed.success) {
    redirectWithStatus("/settings", {
      error: parsed.error.issues[0]?.message ?? "Invalid scheduler config.",
    });
  }

  await prisma.schedulerConfig.upsert({
    where: { id: 1 },
    create: { id: 1, ...parsed.data },
    update: parsed.data,
  });

  revalidatePath("/settings");
  redirectWithStatus("/settings", { ok: "Scheduler configuration saved." });
}

export async function generateScheduleAction(): Promise<void> {
  await assertAdmin();

  const config =
    (await prisma.schedulerConfig.findUnique({ where: { id: 1 } })) ??
    (await prisma.schedulerConfig.create({
      data: {
        id: 1,
      },
    }));

  const result = await generateAssignments(config);

  await createAuditLog("SCHEDULE_GENERATED", {
    windowDays: config.assignmentWindowDays,
    assignmentsPerDay: config.assignmentsPerDay,
    removed: result.removed,
    created: result.created,
    unassignedDates: result.unassignedDates,
    conflicts: result.conflicts,
  });

  revalidatePath("/schedule");

  if (result.conflicts.length > 0) {
    const preview = result.conflicts
      .slice(0, 3)
      .map((item) => `${item.date} slot ${item.slot + 1} (${item.reason})`)
      .join("; ");

    redirectWithStatus("/schedule", {
      ok: `Removed ${result.removed} previous auto assignment(s). Generated ${result.created} assignment(s). ${result.conflicts.length} conflict(s): ${preview}`,
    });
  }

  redirectWithStatus("/schedule", {
    ok: `Removed ${result.removed} previous auto assignment(s). Generated ${result.created} assignment(s).`,
  });
}

export async function overrideAssignmentAction(formData: FormData): Promise<void> {
  await assertAdmin();

  const input = parseFormData(formData);
  const parsed = assignmentOverrideSchema.safeParse(input);

  if (!parsed.success) {
    redirectWithStatus("/schedule", {
      error: parsed.error.issues[0]?.message ?? "Invalid assignment override.",
    });
  }

  const congregation = await prisma.congregation.findUnique({
    where: { id: parsed.data.congregationId },
    select: { id: true, meetingDays: true },
  });

  if (!congregation) {
    redirectWithStatus("/schedule", { error: "Congregation not found." });
  }

  if (congregation.meetingDays.includes(parsed.data.date.getDay())) {
    redirectWithStatus("/schedule", {
      error: "Cannot assign congregation on its meeting day.",
    });
  }

  await prisma.assignment.upsert({
    where: {
      date_slot: {
        date: parsed.data.date,
        slot: parsed.data.slot,
      },
    },
    create: {
      date: parsed.data.date,
      slot: parsed.data.slot,
      congregationId: parsed.data.congregationId,
      source: "MANUAL",
      notes: parsed.data.notes,
    },
    update: {
      congregationId: parsed.data.congregationId,
      source: "MANUAL",
      notes: parsed.data.notes,
    },
  });

  await createAuditLog("ASSIGNMENT_MANUAL_OVERRIDE", {
    date: parsed.data.date.toISOString(),
    slot: parsed.data.slot,
    congregationId: parsed.data.congregationId,
    notes: parsed.data.notes ?? null,
  });

  revalidatePath("/schedule");
  redirectWithStatus("/schedule", { ok: "Assignment overridden." });
}

