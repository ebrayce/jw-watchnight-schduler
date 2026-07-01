import { type SchedulerConfig } from "@prisma/client";
import { formatDateKey } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { buildAssignmentPlan } from "@/lib/scheduler-core";

function startOfDay(input: Date): Date {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(input: Date, days: number): Date {
  const date = new Date(input);
  date.setDate(date.getDate() + days);
  return date;
}


export async function generateAssignments(config: SchedulerConfig): Promise<{
  removed: number;
  created: number;
  unassignedDates: string[];
  conflicts: { date: string; slot: number; reason: string }[];
}> {
  const today = startOfDay(new Date());
  const endDate = addDays(today, config.assignmentWindowDays);

  const removedResult = await prisma.assignment.deleteMany({
    where: {
      source: "AUTO",
      date: {
        gte: today,
      },
    },
  });

  const congregations = await prisma.congregation.findMany({
    where: { isActive: true },
    include: {
      assignments: {
        where: {
          date: {
            gte: addDays(today, -30),
          },
        },
        select: { date: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const existingAssignments = await prisma.assignment.findMany({
    where: {
      date: {
        gte: today,
        lt: endDate,
      },
    },
    select: {
      date: true,
      slot: true,
    },
  });

  const existingSlots = new Set(
    existingAssignments.map((assignment) => `${formatDateKey(assignment.date)}:${assignment.slot}`),
  );

  const { plan, unassignedDates, conflicts } = buildAssignmentPlan({
    startDate: today,
    days: config.assignmentWindowDays,
    assignmentsPerDay: config.assignmentsPerDay,
    weekStartsOn: config.weekStartsOn,
    avoidConsecutiveDays: config.avoidConsecutiveDays,
    congregations,
  });

  const rowsToCreate = plan.filter(
    (item) => !existingSlots.has(`${formatDateKey(item.date)}:${item.slot}`),
  );

  if (rowsToCreate.length === 0) {
    return { removed: removedResult.count, created: 0, unassignedDates, conflicts };
  }

  const created = await prisma.$transaction(async (tx) => {
    let count = 0;
    for (const row of rowsToCreate) {
      await tx.assignment.create({
        data: {
          date: row.date,
          slot: row.slot,
          congregationId: row.congregationId,
          source: "AUTO",
        },
      });
      count += 1;
    }
    return count;
  });

  return { removed: removedResult.count, created, unassignedDates, conflicts };
}


