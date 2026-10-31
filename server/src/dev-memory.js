// Zero-setup local run: starts a throwaway in-memory MongoDB, seeds the demo account and starts the API.
// Data is lost when the process stops. For real use, set MONGODB_URI and run `npm run dev`.
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './config.js';
import { createApp } from './app.js';
import { seedDemo, DEMO_USER } from './seed.js';

const mongo = await MongoMemoryServer.create();
await mongoose.connect(mongo.getUri());
await seedDemo();

createApp().listen(config.port, () => {
  console.log(`API (in-memory MongoDB) on http://localhost:${config.port}`);
  console.log(`Demo login: ${DEMO_USER.email} / ${DEMO_USER.password}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await mongoose.disconnect();
    await mongo.stop();
    process.exit(0);
  });
}
