import 'dotenv/config';
import { MongoClient } from 'mongodb';
const [type,name,slug] = process.argv.slice(2);
if (!['community','group'].includes(type) || !name || !slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('Usage: npm run add:org -- community "Abuloma" abuloma');
  process.exit(1);
}
async function main(){
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'vila_waitlist');
    await db.collection('organizations').createIndex({ type:1, slug:1 }, { unique:true });
    await db.collection('organizations').updateOne({ type, slug }, { $set: { name, type, slug } }, { upsert:true });
    console.log('Link: /' + (type === 'community' ? 'c' : 'g') + '/' + slug);
  } finally { await client.close(); }
}
main().catch(e => { console.error(e);process.exit(1); });
