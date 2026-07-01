import { z } from "zod";
import { fromDateInputValue } from "@/lib/dates";

export const weekDayOptions = [0, 1, 2, 3, 4, 5, 6] as const;

export const congregationInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  overseer: z.string().trim().min(2).max(120),
  contactPrimary: z.string().trim().min(4).max(120),
  contactAlternate: z.string().trim().max(120).optional(),
  meetingDays: z
    .array(z.coerce.number().int().min(0).max(6))
    .min(2)
    .max(2)
    .refine((days) => new Set(days).size === days.length, "Meeting days must be unique."),
  isActive: z.coerce.boolean().default(true),
});

export const schedulerConfigInputSchema = z.object({
  assignmentWindowDays: z.coerce.number().int().min(7).max(365),
  assignmentsPerDay: z.coerce.number().int().min(1).max(3),
  weekStartsOn: z.coerce.number().int().min(0).max(6),
  avoidConsecutiveDays: z.coerce.boolean().default(false),
});

export const assignmentOverrideSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .transform((value) => fromDateInputValue(value)),
  slot: z.coerce.number().int().min(0).max(2),
  congregationId: z.string().min(1),
  notes: z.string().trim().max(250).optional(),
});

export function parseFormData(formData: FormData): Record<string, FormDataEntryValue | FormDataEntryValue[]> {
  const values = new Map<string, FormDataEntryValue[]>();

  for (const [key, value] of formData.entries()) {
    const current = values.get(key) ?? [];
    current.push(value);
    values.set(key, current);
  }

  const result: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
  for (const [key, value] of values.entries()) {
    result[key] = value.length === 1 ? value[0] : value;
  }

  return result;
}

