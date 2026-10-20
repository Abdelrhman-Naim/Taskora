import { z } from 'zod';
import { TASK_PRIORITIES, RECURRENCES } from '@/types';

function isValidDateString(val: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
  const [y, m, d] = val.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

export const emailSchema = z
  .string()
  .trim()
  .email('validation.email.invalid');

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'validation.name.required')
    .max(60, 'validation.name.length'),
  email: emailSchema,
  password: z
    .string()
    .min(6, 'validation.password.length'),
});

export const projectInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'validation.name.length')
    .max(80, 'validation.name.length'),
  description: z
    .string()
    .trim()
    .max(1000, 'validation.description.length')
    .default('')
    .optional()
    .transform((val) => val ?? ''),
});

export const checklistItemSchema = z.object({
  id: z.string().min(1),
  text: z
    .string()
    .trim()
    .min(1, 'validation.checklist.item.length')
    .max(120, 'validation.checklist.item.length'),
  done: z.boolean(),
});

export const taskInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'validation.title.length')
      .max(120, 'validation.title.length'),
    description: z
      .string()
      .trim()
      .max(1000, 'validation.description.length')
      .default('')
      .optional()
      .transform((val) => val ?? ''),
    priority: z.enum(TASK_PRIORITIES, {
      message: 'validation.priority.invalid',
    }),
    assigneeId: z.string().nullable().optional().default(null),
    dueDate: z
      .string()
      .nullable()
      .optional()
      .refine((val) => val === null || val === undefined || isValidDateString(val), {
        message: 'validation.dueDate.invalid',
      })
      .default(null),
    checklist: z
      .array(checklistItemSchema)
      .max(20, 'validation.checklist.limit')
      .optional()
      .default([]),
    labels: z
      .array(
        z
          .string()
          .trim()
          .min(1, 'validation.label.length')
          .max(24, 'validation.label.length')
      )
      .max(5, 'validation.labels.limit')
      .refine(
        (arr) => {
          const lower = arr.map((s) => s.toLowerCase());
          return new Set(lower).size === lower.length;
        },
        { message: 'validation.labels.duplicate' }
      )
      .optional()
      .default([]),
    recurrence: z
      .enum(RECURRENCES, {
        message: 'validation.recurrence.invalid',
      })
      .optional()
      .default('none'),
  })
  .superRefine((data, ctx) => {
    if (data.recurrence && data.recurrence !== 'none' && !data.dueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recurrence'],
        message: 'validation.recurrence.needsDueDate',
      });
    }
  });

export function fieldErrors(err: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0] ? String(issue.path[0]) : '_root';
    if (!result[key]) {
      result[key] = issue.message;
    }
  }
  return result;
}
