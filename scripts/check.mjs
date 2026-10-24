import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const child = spawn(process.execPath, ['server.js'], {
  env: { ...process.env, ENABLE_SYSTEM_RESTART: 'false' },
  stdio: ['ignore', 'pipe', 'inherit'],
});
try {
  await new Promise((resolve, reject) => {
    child.stdout.once('data', resolve);
    child.once('error', reject);
    child.once('exit', () => reject(new Error('Server exited before startup')));
  });
  const base = 'http://127.0.0.1:4173';
  assert.equal((await fetch(base)).status, 200);
  const session = await (await fetch(`${base}/api/session`)).json();
  assert.equal(session.enabled, false);
  assert.equal(session.deadline, null);
  const invalid = await fetch(`${base}/api/restart`, { method: 'POST' });
  assert.equal(invalid.status, 403);
  for (const endpoint of ['restart', 'cancel']) {
    const response = await fetch(`${base}/api/${endpoint}`, {
      method: 'POST',
      headers: { Origin: base, 'X-Device-Token': session.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation: 'RESTART THIS PC' }),
    });
    assert.equal(response.status, 403);
    assert.match((await response.json()).error, /disabled/);
  }
  console.log('PASS: built UI, session, request guard, and disabled restart/cancel. No OS restart executed.');
} finally {
  child.kill();
}
