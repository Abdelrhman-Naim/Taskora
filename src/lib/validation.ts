import { z } from 'zod';
import { TASK_PRIORITIES } from '@/types';

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
  .email('Please enter a valid email address');

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(60, 'Name must be 60 characters or less'),
  email: emailSchema,
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

export const projectInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Project name must be between 3 and 80 characters')
    .max(80, 'Project name must be between 3 and 80 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must be 1000 characters or less')
    .default('')
    .optional()
    .transform((val) => val ?? ''),
});

export const taskInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Task title must be between 3 and 120 characters')
    .max(120, 'Task title must be between 3 and 120 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must be 1000 characters or less')
    .default('')
    .optional()
    .transform((val) => val ?? ''),
  priority: z.enum(TASK_PRIORITIES, {
    message: 'Priority must be low, medium, or high',
  }),
  assigneeId: z.string().nullable().optional().default(null),
  dueDate: z
    .string()
    .nullable()
    .optional()
    .refine((val) => val === null || val === undefined || isValidDateString(val), {
      message: 'Due date must be a valid date in YYYY-MM-DD format',
    })
    .default(null),
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
