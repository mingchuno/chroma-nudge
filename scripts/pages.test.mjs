import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

test('Pages publishes the complete local app at the site root without external assets', async () => {
  assert.equal(await readFile('pages/index.html', 'utf8'), await readFile('dist/chroma-nudge.html', 'utf8'));
  assert.deepEqual((await readdir('pages')).sort(), ['.nojekyll', 'index.html']);
});
