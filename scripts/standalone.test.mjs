import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

test('standalone embeds the bundle unchanged, including replacement metacharacters', async () => {
  const index = await readFile('dist/index.html', 'utf8');
  const standalone = await readFile('dist/chroma-nudge.html', 'utf8');
  const source = index.match(/<script[^>]+src="([^"]+)"/)[1];
  const bundle = await readFile(resolve('dist', source), 'utf8');
  const embedded = standalone.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
  assert.equal(embedded, bundle.replaceAll('</script', '<\\/script'));
  assert.equal((standalone.match(/<script type="module">/g) ?? []).length, 1);
  assert.ok(!standalone.includes('src="./assets/'));
  assert.ok(standalone.includes("connect-src 'none'"));
});

test('packaging includes dependency licenses without a separate notices document', async () => {
  await promisify(execFile)(process.execPath, ['scripts/standalone.mjs']);
  const standalone = await readFile('dist/chroma-nudge.html', 'utf8');
  for (const dependency of [
    'react',
    'react-dom',
    '@fontsource-variable/newsreader',
    '@fontsource-variable/dm-sans',
  ]) {
    const license = await readFile(resolve('node_modules', dependency, 'LICENSE'), 'utf8');
    assert.ok(standalone.includes(license.replaceAll('--', '—')), `Missing license for ${dependency}`);
  }
});
