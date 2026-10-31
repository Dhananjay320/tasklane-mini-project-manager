import mongoose from 'mongoose';
import { config } from './config.js';
import { createApp } from './app.js';

if (!config.mongoUri) {
  console.error('MONGODB_URI is not set. Copy server/.env.example to server/.env and fill it in.');
  process.exit(1);
}

await mongoose.connect(config.mongoUri);
console.log('Connected to MongoDB');

const server = createApp().listen(config.port, () => console.log(`API listening on http://localhost:${config.port}`));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  });
}
