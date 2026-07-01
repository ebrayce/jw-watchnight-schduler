import { buildAssignmentPlan } from "../lib/scheduler-core";

const congregations = [
  { id: "a", meetingDays: [2, 0], isActive: true, assignments: [] },
  { id: "b", meetingDays: [1, 4], isActive: true, assignments: [] },
  { id: "c", meetingDays: [3, 6], isActive: true, assignments: [] },
];

const result = buildAssignmentPlan({
  startDate: new Date("2026-07-01T00:00:00.000Z"),
  days: 14,
  assignmentsPerDay: 1,
  weekStartsOn: 1,
  avoidConsecutiveDays: false,
  congregations,
});

console.log(`planned=${result.plan.length}`);
console.log(`unassigned=${result.unassignedDates.length}`);
console.log(result.plan.slice(0, 5));


