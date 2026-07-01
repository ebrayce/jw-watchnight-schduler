import { type Assignment, type Congregation } from "@prisma/client";
import { formatDateKey } from "@/lib/dates";

export type AssignmentPlanItem = {
  date: Date;
  slot: number;
  congregationId: string;
};

export type AssignmentConflict = {
  date: string;
  slot: number;
  reason: string;
};

export type CongregationWithAssignments = Pick<Congregation, "id" | "meetingDays" | "isActive"> & {
  assignments: Pick<Assignment, "date">[];
};

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

function weekId(input: Date, weekStartsOn: number): string {
  const date = startOfDay(input);
  const diff = (date.getDay() - weekStartsOn + 7) % 7;
  date.setDate(date.getDate() - diff);
  return formatDateKey(date);
}

function countAssignmentsByWeek(
  assignments: Pick<Assignment, "date">[],
  weekStartsOn: number,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const assignment of assignments) {
    const key = weekId(assignment.date, weekStartsOn);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function randomIndex(max: number): number {
  return Math.floor(Math.random() * max);
}

function getConflictReason(params: {
  date: Date;
  candidates: CongregationWithAssignments[];
  avoidConsecutiveDays: boolean;
}): string {
  const { date, candidates, avoidConsecutiveDays } = params;
  const dayOfWeek = date.getDay();
  const previousDay = formatDateKey(addDays(date, -1));

  let inactiveCount = 0;
  let meetingDayCount = 0;
  let consecutiveCount = 0;

  for (const congregation of candidates) {
    if (!congregation.isActive) {
      inactiveCount += 1;
      continue;
    }
    if (congregation.meetingDays.includes(dayOfWeek)) {
      meetingDayCount += 1;
      continue;
    }
    if (avoidConsecutiveDays) {
      const hadPreviousDay = congregation.assignments.some(
        (assignment) => formatDateKey(assignment.date) === previousDay,
      );
      if (hadPreviousDay) {
        consecutiveCount += 1;
      }
    }
  }

  const reasons: string[] = [];
  if (meetingDayCount > 0) {
    reasons.push(`${meetingDayCount} meeting-day blocked`);
  }
  if (consecutiveCount > 0) {
    reasons.push(`${consecutiveCount} consecutive-day blocked`);
  }
  if (inactiveCount > 0) {
    reasons.push(`${inactiveCount} inactive`);
  }

  if (reasons.length === 0) {
    return "No eligible congregation available for this slot.";
  }

  return reasons.join(", ");
}

function selectCongregation(
  date: Date,
  congregations: CongregationWithAssignments[],
  weekStartsOn: number,
  avoidConsecutiveDays: boolean,
): CongregationWithAssignments | null {
  const dayOfWeek = date.getDay();
  const currentWeek = weekId(date, weekStartsOn);
  const previousDay = formatDateKey(addDays(date, -1));

  const eligible = congregations.filter((congregation) => {
    if (!congregation.isActive) {
      return false;
    }

    if (congregation.meetingDays.includes(dayOfWeek)) {
      return false;
    }

    if (avoidConsecutiveDays) {
      const hadPreviousDay = congregation.assignments.some(
        (assignment) => formatDateKey(assignment.date) === previousDay,
      );
      if (hadPreviousDay) {
        return false;
      }
    }

    return true;
  });

  if (eligible.length === 0) {
    return null;
  }

  const withScores = eligible.map((congregation) => {
    const weekCounts = countAssignmentsByWeek(congregation.assignments, weekStartsOn);
    return {
      congregation,
      weekCount: weekCounts.get(currentWeek) ?? 0,
      totalCount: congregation.assignments.length,
    };
  });

  withScores.sort((a, b) => {
    if (a.weekCount !== b.weekCount) {
      return a.weekCount - b.weekCount;
    }
    return a.totalCount - b.totalCount;
  });

  const bestWeekCount = withScores[0]?.weekCount;
  const bestTotalCount = withScores[0]?.totalCount;
  const pool = withScores
    .filter((score) => score.weekCount === bestWeekCount && score.totalCount === bestTotalCount)
    .map((score) => score.congregation);

  return pool[randomIndex(pool.length)] ?? null;
}

export function buildAssignmentPlan(params: {
  startDate: Date;
  days: number;
  assignmentsPerDay: number;
  weekStartsOn: number;
  avoidConsecutiveDays: boolean;
  congregations: CongregationWithAssignments[];
}): { plan: AssignmentPlanItem[]; unassignedDates: string[]; conflicts: AssignmentConflict[] } {
  const { startDate, days, assignmentsPerDay, weekStartsOn, avoidConsecutiveDays, congregations } = params;

  const plan: AssignmentPlanItem[] = [];
  const unassignedDates: string[] = [];
  const conflicts: AssignmentConflict[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const date = startOfDay(addDays(startDate, offset));
    let assignedToday = 0;

    for (let slot = 0; slot < assignmentsPerDay; slot += 1) {
      const alreadyAssignedIds = new Set(
        plan
          .filter((item) => formatDateKey(item.date) === formatDateKey(date))
          .map((item) => item.congregationId),
      );

      const availableCongregations = congregations.filter(
        (congregation) => !alreadyAssignedIds.has(congregation.id),
      );

      const selected = selectCongregation(date, availableCongregations, weekStartsOn, avoidConsecutiveDays);
      if (!selected) {
        conflicts.push({
          date: formatDateKey(date),
          slot,
          reason: getConflictReason({ date, candidates: availableCongregations, avoidConsecutiveDays }),
        });
        continue;
      }

      selected.assignments.push({ date });
      plan.push({
        date,
        slot,
        congregationId: selected.id,
      });
      assignedToday += 1;
    }

    if (assignedToday < assignmentsPerDay) {
      unassignedDates.push(formatDateKey(date));
    }
  }

  return { plan, unassignedDates, conflicts };
}

