import { assertConfig, config } from './config/index.js';
import { connectDb } from './config/db.js';
import { createApp } from './app.js';

async function main() {
  assertConfig();
  await connectDb();
  createApp().listen(config.port, () => {
    console.log(`[server] listening on :${config.port}`);
  });
}

main().catch((err) => {
  console.error('[fatal]', err.message);
  process.exit(1);
});
