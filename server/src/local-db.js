// `npm run db:local`: runs a real MongoDB server on 127.0.0.1:27017 with data kept in server/.data,
// using the mongod binary that mongodb-memory-server already downloads for the tests.
// Handy when MongoDB isn't installed; with an installed MongoDB you don't need this.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MongoBinary } from 'mongodb-memory-server';

const dbPath = fileURLToPath(new URL('../.data', import.meta.url));
mkdirSync(dbPath, { recursive: true });

const mongod = await MongoBinary.getPath();
const port = process.env.MONGO_PORT || '27017';
console.log(`Starting MongoDB on mongodb://127.0.0.1:${port} (data in ${dbPath})`);

const child = spawn(mongod, ['--dbpath', dbPath, '--port', port, '--bind_ip', '127.0.0.1', '--quiet'], { stdio: ['ignore', 'ignore', 'inherit'] });
child.on('exit', (code) => process.exit(code ?? 0));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill('SIGINT'));
