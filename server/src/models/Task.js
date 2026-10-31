import mongoose from 'mongoose';

export const TASK_STATUSES = ['todo', 'in-progress', 'done'];

const taskSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    // Stored on the task too, so every task query can be scoped to its owner in one step.
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    status: { type: String, enum: TASK_STATUSES, default: 'todo' },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true },
);

taskSchema.index({ owner: 1, project: 1, status: 1, dueDate: 1 });

taskSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.project = ret.project.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.owner;
    return ret;
  },
});

export const Task = mongoose.model('Task', taskSchema);
