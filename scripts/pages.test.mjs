import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

test('Pages includes installation assets with paths scoped to the deployed directory', async () => {
  const html = await readFile('pages/index.html', 'utf8');
  assert.ok(html.includes('href="./manifest.webmanifest"'));
  assert.ok(html.includes("manifest-src 'self'"));
  assert.ok(html.includes("connect-src 'none'"));
  const manifest = JSON.parse(await readFile('pages/manifest.webmanifest', 'utf8'));
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    const png = await readFile(`pages/${icon.src}`);
    const size = Number(icon.sizes.split('x')[0]);
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
  assert.ok((await readdir('pages')).includes('apple-touch-icon.png'));
});
