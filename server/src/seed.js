import bcrypt from 'bcryptjs';
import { User } from './models/User.js';
import { Project } from './models/Project.js';
import { Task } from './models/Task.js';

export const DEMO_USER = { name: 'Demo User', email: 'demo@tasklane.dev', password: 'demo12345' };

const day = (offset) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
};

const PROJECTS = [
  {
    title: 'Website redesign',
    description: 'New homepage, pricing page and blog for the spring launch.',
    tasks: [
      ['Write homepage copy', 'Hero, three feature blocks and the closing call to action.', 'in-progress', 0],
      ['Pick a colour palette', 'Two options for review with the brand team.', 'done', -11],
      ['Set up staging server', 'Preview deploys for every pull request.', 'todo', -3],
      ['Design pricing page', 'Three plans, a comparison table and FAQ.', 'in-progress', 4],
      ['Migrate blog posts', 'Move 42 posts and fix their image links.', 'todo', 12],
      ['Accessibility audit', 'Keyboard, contrast and screen-reader pass on every page.', 'todo', null],
      ['Set up analytics', 'Page views, sign-up funnel and a weekly report.', 'done', -6],
    ],
  },
  {
    title: 'Mobile app launch',
    description: 'Ship v1.0 of the iOS and Android apps to the stores.',
    tasks: [
      ['Store screenshots', 'Six screenshots per platform in three sizes.', 'todo', 2],
      ['Beta feedback round', 'Collect and triage feedback from 30 testers.', 'in-progress', -1],
      ['Push notifications', 'Reminders for tasks due tomorrow.', 'todo', 9],
      ['Crash reporting', 'Add crash reports and alert on new issues.', 'done', -4],
    ],
  },
  {
    title: 'Q4 marketing plan',
    description: 'Campaign calendar, budget and channel owners for Oct–Dec.',
    tasks: [
      ['Budget draft', 'Split by channel with last quarter for comparison.', 'done', -8],
      ['Campaign calendar', 'One page, every launch and email date.', 'in-progress', 5],
      ['Agency brief', null, 'todo', 14],
    ],
  },
];

/** Creates the demo account with sample projects, once. Returns false if it already exists. */
export async function seedDemo() {
  if (await User.exists({ email: DEMO_USER.email })) return false;
  const user = await User.create({
    name: DEMO_USER.name,
    email: DEMO_USER.email,
    passwordHash: await bcrypt.hash(DEMO_USER.password, 12),
  });
  for (const p of PROJECTS) {
    const project = await Project.create({ owner: user._id, title: p.title, description: p.description });
    await Task.insertMany(
      p.tasks.map(([title, description, status, due]) => ({
        project: project._id,
        owner: user._id,
        title,
        description: description ?? '',
        status,
        dueDate: due === null ? null : day(due),
      })),
    );
  }
  return true;
}
