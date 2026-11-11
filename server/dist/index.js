'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
require('./config/loadEnv');
const app_1 = require('./app');
const env_1 = require('./config/env');
const database_1 = require('./config/database');
async function main() {
  await (0, database_1.connectDatabase)();
  app_1.app.listen(env_1.env.port, () =>
    console.log('VILA API running on port ' + env_1.env.port),
  );
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
