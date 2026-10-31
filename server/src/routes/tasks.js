import { Router } from 'express';
import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, validId } from '../middleware/validate.js';
import { notFound } from '../utils/httpError.js';
import { taskCreateSchema, taskUpdateSchema, taskListQuerySchema } from '../schemas.js';

// Mounted at /api/projects/:projectId/tasks
export const projectTasksRouter = Router({ mergeParams: true });
// Mounted at /api/tasks
export const tasksRouter = Router();
projectTasksRouter.use(requireAuth, validId('projectId', 'Project'));
tasksRouter.use(requireAuth);

async function assertOwnProject(req) {
  if (!(await Project.exists({ _id: req.params.projectId, owner: req.userId }))) throw notFound('Project');
}

// Tasks without a due date always come last, whichever direction the dates are sorted.
const SORTS = {
  due_asc: { noDue: 1, dueDate: 1, createdAt: -1 },
  due_desc: { noDue: 1, dueDate: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
};

projectTasksRouter.get('/', validate(taskListQuerySchema, 'query'), async (req, res) => {
  await assertOwnProject(req);
  const { status, sort } = req.valid.query;
  const match = {
    project: new mongoose.Types.ObjectId(req.params.projectId),
    owner: new mongoose.Types.ObjectId(req.userId),
  };
  if (status) match.status = status;
  const rows = await Task.aggregate([
    { $match: match },
    { $addFields: { noDue: { $cond: [{ $eq: [{ $ifNull: ['$dueDate', null] }, null] }, 1, 0] } } },
    { $sort: SORTS[sort] },
    { $project: { noDue: 0 } },
  ]);
  res.json({ tasks: rows.map((row) => Task.hydrate(row).toJSON()) });
});

projectTasksRouter.post('/', validate(taskCreateSchema), async (req, res) => {
  await assertOwnProject(req);
  const task = await Task.create({ ...req.valid.body, project: req.params.projectId, owner: req.userId });
  await Project.updateOne({ _id: req.params.projectId }, { $currentDate: { updatedAt: true } });
  res.status(201).json({ task });
});

async function findOwnTask(req) {
  const task = await Task.findOne({ _id: req.params.id, owner: req.userId });
  if (!task) throw notFound('Task');
  return task;
}

tasksRouter.get('/:id', validId('id', 'Task'), async (req, res) => {
  res.json({ task: await findOwnTask(req) });
});

tasksRouter.patch('/:id', validId('id', 'Task'), validate(taskUpdateSchema), async (req, res) => {
  const task = await findOwnTask(req);
  task.set(req.valid.body);
  await task.save();
  await Project.updateOne({ _id: task.project }, { $currentDate: { updatedAt: true } });
  res.json({ task });
});

tasksRouter.delete('/:id', validId('id', 'Task'), async (req, res) => {
  const task = await findOwnTask(req);
  await task.deleteOne();
  await Project.updateOne({ _id: task.project }, { $currentDate: { updatedAt: true } });
  res.status(204).end();
});
