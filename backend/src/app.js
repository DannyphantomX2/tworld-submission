import express from 'express';
import { requestLogger } from './middleware/logger.js';
import authRoutes from './routes/auth.js';
import contentRoutes from './routes/content.js';
import aiRoutes from './routes/ai.js';
import tokenRoutes from './routes/tokens.js';
import mediaRoutes from './routes/media.js';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/auth', authRoutes);
  app.use('/content', contentRoutes);
  app.use('/content', aiRoutes);
  app.use('/tokens', tokenRoutes);
  app.use('/media', mediaRoutes);

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Request body is not valid JSON' });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large (10MB max)' });
    }
    if (!err.status) console.error('[error]', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Internal server error' });
  });

  return app;
}