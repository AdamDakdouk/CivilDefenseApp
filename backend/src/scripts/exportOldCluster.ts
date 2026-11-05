import fs from 'fs';
import os from 'os';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Tries to reach the OLD cluster (the commented-out MONGODB_URI in .env that is not the active one)
// and, the moment it answers, dumps every collection to JSON files OUTSIDE the repo.
// Read-only: it never writes to any database.
//
// Usage: npx ts-node src/scripts/exportOldCluster.ts          (one attempt)
//        npx ts-node src/scripts/exportOldCluster.ts --watch  (retry every 10 minutes until it works)
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { MongoClient, BSON } = mongoose.mongo;
const { EJSON } = BSON;

const RETRY_MS = 10 * 60 * 1000;
const watch = process.argv.includes('--watch');

const findOldUri = (): string => {
  const envText = fs.readFileSync(path.join(__dirname, '../../.env'), 'utf8');
  const hostOf = (uri: string) => (uri.match(/@([^/?]+)/) || [])[1];
  const activeHost = hostOf(process.env.MONGODB_URI || '');

  const candidates = envText
    .split(/\r?\n/)
    .filter(line => /MONGODB_URI\s*=/.test(line))
    .map(line => line.replace(/^#\s*/, '').split('=').slice(1).join('=').trim())
    .filter(uri => uri.startsWith('mongodb'));

  const clusterOf = (uri: string) => (hostOf(uri) || '').split('.').slice(1).join('.');
  const old = candidates.find(uri => clusterOf(uri) !== clusterOf(process.env.MONGODB_URI || '') && hostOf(uri) !== activeHost);
  if (!old) throw new Error('No old cluster URI found in .env');
  return old;
};

const attempt = async (uri: string): Promise<boolean> => {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 30000, readPreference: 'secondaryPreferred' });
  try {
    await client.connect();
    const { databases } = await client.db().admin().listDatabases();
    const outDir = path.join(os.homedir(), `civildefense-old-export-${new Date().toISOString().replace(/[:.]/g, '-')}`);
    fs.mkdirSync(outDir, { recursive: true });

    for (const dbInfo of databases) {
      if (['admin', 'local', 'config', 'sample_mflix'].includes(dbInfo.name)) continue;
      const db = client.db(dbInfo.name);
      const dbDir = path.join(outDir, dbInfo.name);
      fs.mkdirSync(dbDir, { recursive: true });

      for (const { name } of await db.listCollections().toArray()) {
        const docs = await db.collection(name).find({}).toArray();
        fs.writeFileSync(path.join(dbDir, `${name}.json`), EJSON.stringify(docs, { relaxed: false }, 2));
        console.log(`  ${dbInfo.name}.${name}: ${docs.length} documents`);
      }
    }

    console.log(`✅ Export complete: ${outDir}`);
    return true;
  } catch (error: any) {
    console.log(`❌ ${new Date().toLocaleTimeString()} not reachable: ${String(error.message).split('\n')[0].slice(0, 120)}`);
    return false;
  } finally {
    await client.close().catch(() => undefined);
  }
};

const run = async () => {
  const uri = findOldUri();
  console.log(`Old cluster host: ${(uri.match(/@([^/?]+)/) || [])[1]}`);

  while (true) {
    if (await attempt(uri)) process.exit(0);
    if (!watch) process.exit(1);
    console.log(`   retrying in ${RETRY_MS / 60000} minutes...`);
    await new Promise(resolve => setTimeout(resolve, RETRY_MS));
  }
};

run();
