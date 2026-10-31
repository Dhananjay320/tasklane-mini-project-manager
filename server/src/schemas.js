import { z } from 'zod';
import { TASK_STATUSES } from './models/Task.js';

const text = (max, label) => z.string().trim().max(max, `${label} must be at most ${max} characters`);
const title = (max) => text(max, 'Title').min(1, 'Title is required');

export const signupSchema = z.object({
  name: text(80, 'Name').min(1, 'Name is required'),
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password is too long'),
});

export const loginSchema = z.object({
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const projectCreateSchema = z.object({
  title: title(80),
  description: text(500, 'Description').optional().default(''),
});
// No defaults here: a field left out of a PATCH must stay unchanged, not reset to ''.
export const projectUpdateSchema = z
  .object({ title: title(80).optional(), description: text(500, 'Description').optional() })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

// Accepts "2026-11-04" or a full ISO timestamp; null or "" clears the date.
const dueDate = z
  .union([z.iso.date(), z.iso.datetime({ offset: true }), z.literal(''), z.null()])
  .transform((v) => (v ? new Date(v) : null));

const status = z.enum(TASK_STATUSES, { error: 'Status must be todo, in-progress or done' });

export const taskCreateSchema = z.object({
  title: title(120),
  description: text(1000, 'Description').optional().default(''),
  status: status.optional().default('todo'),
  dueDate: dueDate.optional().default(null),
});

export const taskUpdateSchema = z
  .object({
    title: title(120).optional(),
    description: text(1000, 'Description').optional(),
    status: status.optional(),
    dueDate: dueDate.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const taskListQuerySchema = z.object({
  status: status.optional(),
  sort: z.enum(['due_asc', 'due_desc', 'newest', 'oldest']).optional().default('due_asc'),
});

export const projectListQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
});
