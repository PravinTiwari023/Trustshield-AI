import express from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const app = express();
const port = 4173;
const origin = `http://127.0.0.1:${port}`;
const token = randomBytes(32).toString('hex');
const enabled = process.platform === 'win32' && process.env.ENABLE_SYSTEM_RESTART === 'true';
const execute = promisify(execFile);
let deadline = null;
let operating = false;

app.use((req, res, next) => {
  if (req.headers.host !== `127.0.0.1:${port}`) return res.status(403).json({ error: 'Use the local 127.0.0.1 address.' });
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'no-referrer');
  res.set('X-Frame-Options', 'DENY');
  next();
});
app.use(express.json({ limit: '1kb' }));
app.get('/api/session', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ token, enabled, deadline });
});
app.use('/api', (req, res, next) => {
  const supplied = Buffer.from(req.get('X-Device-Token') || '');
  const expected = Buffer.from(token);
  if (req.get('Origin') !== origin || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return res.status(403).json({ error: 'Open the local app and confirm the action there.' });
  }
  if (!enabled) return res.status(403).json({ error: 'Actual restart is disabled. Enable it explicitly on your Windows PC.' });
  if (operating) return res.status(409).json({ error: 'Another device action is in progress.' });
  next();
});
app.post('/api/restart', async (req, res) => {
  if (req.body?.confirmation !== 'RESTART THIS PC') return res.status(400).json({ error: 'Explicit restart confirmation is required.' });
  if (deadline) return res.status(409).json({ error: 'A restart is already scheduled.' });
  operating = true;
  try {
    await execute('shutdown.exe', ['/r', '/t', '30', '/c', 'Trustshield AI: user-confirmed restart. Save your work.']);
    deadline = Date.now() + 30_000;
    res.json({ deadline });
  } catch { res.status(500).json({ error: 'Windows could not schedule the restart. Check local permissions.' }); }
  finally { operating = false; }
});
app.post('/api/cancel', async (req, res) => {
  if (!deadline) return res.status(409).json({ error: 'No restart is scheduled by this app.' });
  operating = true;
  try {
    await execute('shutdown.exe', ['/a']);
    deadline = null;
    res.json({ deadline });
  } catch { res.status(500).json({ error: 'Windows could not cancel the restart; it may already be underway.' }); }
  finally { operating = false; }
});
app.use(express.static(fileURLToPath(new URL('./dist', import.meta.url))));
app.listen(port, '127.0.0.1', () => console.log(`Trustshield AI: ${origin} — ${enabled ? 'REAL RESTART ENABLED' : 'preview mode'}`));
