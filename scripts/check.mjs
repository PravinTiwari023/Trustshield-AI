import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';

async function withServer(restartSetting, verify) {
  const listener = createServer();
  await new Promise((resolve, reject) => {
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', resolve);
  });
  const { port } = listener.address();
  await new Promise(resolve => listener.close(resolve));
  const env = { ...process.env, PORT: String(port) };
  if (restartSetting === undefined) delete env.ENABLE_SYSTEM_RESTART;
  else env.ENABLE_SYSTEM_RESTART = restartSetting;
  const child = spawn(process.execPath, ['server.js'], {
    env,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  try {
    await new Promise((resolve, reject) => {
      child.stdout.once('data', resolve);
      child.once('error', reject);
      child.once('exit', () => reject(new Error('Server exited before startup')));
    });
    await verify(`http://127.0.0.1:${port}`);
  } finally {
    child.kill();
    await new Promise(resolve => child.once('exit', resolve));
  }
}

await withServer('false', async base => {
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
});
await withServer(undefined, async base => {
  const session = await (await fetch(`${base}/api/session`)).json();
  assert.equal(session.enabled, process.platform === 'win32');
});
console.log('PASS: built UI, preview safeguards, and Windows enablement. No OS restart executed.');
