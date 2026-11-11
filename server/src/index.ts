import 'dotenv/config';
import { app } from './app';
import { env, validateEnvironment } from './config/env';
import { connectDatabase } from './config/database';

async function main() {
  validateEnvironment();
  await connectDatabase();
  app.listen(env.port, () => console.log('VILA API running on port ' + env.port));
}
main().catch(error => { console.error(error); process.exit(1); });
