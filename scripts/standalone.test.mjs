import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

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
