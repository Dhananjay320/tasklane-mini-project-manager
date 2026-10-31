import { Router } from 'express';
import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, validId } from '../middleware/validate.js';
import { notFound } from '../utils/httpError.js';
import { projectCreateSchema, projectUpdateSchema, projectListQuerySchema } from '../schemas.js';

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function startOfTodayUtc() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Task counts per project: { [projectId]: { todo, inProgress, done, total, overdue } } in one query. */
export async function taskCountsFor(ownerId, projectIds) {
  const rows = await Task.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(ownerId), project: { $in: projectIds } } },
    {
      $group: {
        _id: '$project',
        todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
        done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
        overdue: {
          $sum: {
            $cond: [
              { $and: [{ $ne: ['$status', 'done'] }, { $ne: ['$dueDate', null] }, { $lt: ['$dueDate', startOfTodayUtc()] }] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);
  const byId = Object.fromEntries(rows.map(({ _id, ...c }) => [_id.toString(), { ...c, total: c.todo + c.inProgress + c.done }]));
  const empty = { todo: 0, inProgress: 0, done: 0, overdue: 0, total: 0 };
  return (id) => byId[id.toString()] ?? empty;
}

async function findOwnProject(req) {
  const project = await Project.findOne({ _id: req.params.id, owner: req.userId });
  if (!project) throw notFound('Project');
  return project;
}

projectsRouter.get('/', validate(projectListQuerySchema, 'query'), async (req, res) => {
  const { q } = req.valid.query;
  const filter = { owner: req.userId };
  if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' };
  const projects = await Project.find(filter).sort({ updatedAt: -1 });
  const counts = await taskCountsFor(req.userId, projects.map((p) => p._id));
  res.json({ projects: projects.map((p) => ({ ...p.toJSON(), taskCounts: counts(p._id) })) });
});

projectsRouter.post('/', validate(projectCreateSchema), async (req, res) => {
  const project = await Project.create({ ...req.valid.body, owner: req.userId });
  res.status(201).json({ project: { ...project.toJSON(), taskCounts: { todo: 0, inProgress: 0, done: 0, overdue: 0, total: 0 } } });
});

projectsRouter.get('/:id', validId('id', 'Project'), async (req, res) => {
  const project = await findOwnProject(req);
  const counts = await taskCountsFor(req.userId, [project._id]);
  res.json({ project: { ...project.toJSON(), taskCounts: counts(project._id) } });
});

projectsRouter.patch('/:id', validId('id', 'Project'), validate(projectUpdateSchema), async (req, res) => {
  const project = await findOwnProject(req);
  project.set(req.valid.body);
  await project.save();
  const counts = await taskCountsFor(req.userId, [project._id]);
  res.json({ project: { ...project.toJSON(), taskCounts: counts(project._id) } });
});

projectsRouter.delete('/:id', validId('id', 'Project'), async (req, res) => {
  const project = await findOwnProject(req);
  await Task.deleteMany({ project: project._id, owner: req.userId });
  await project.deleteOne();
  res.status(204).end();
});
