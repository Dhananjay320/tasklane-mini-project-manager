// `npm run seed`: adds the demo account and sample projects to the database in MONGODB_URI.
import mongoose from 'mongoose';
import { config } from './config.js';
import { seedDemo, DEMO_USER } from './seed.js';

if (!config.mongoUri) {
  console.error('MONGODB_URI is not set.');
  process.exit(1);
}
await mongoose.connect(config.mongoUri);
const created = await seedDemo();
console.log(created ? `Seeded. Log in with ${DEMO_USER.email} / ${DEMO_USER.password}` : 'Demo account already exists, nothing to do.');
await mongoose.disconnect();
