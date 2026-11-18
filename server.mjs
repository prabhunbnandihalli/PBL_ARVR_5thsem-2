import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const distDir = path.join(__dirname, 'dist');

app.disable('x-powered-by');

// Render health check endpoint
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Serve hashed Vite build assets with immutable long-lived cache
app.use(
  '/assets',
  express.static(path.join(distDir, 'assets'), {
    maxAge: '1y',
    immutable: true,
  })
);

// Serve remaining static files from dist/
app.use(
  express.static(distDir, {
    index: false,
  })
);

// SPA fallback to index.html for all client routes
app.get('*', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
