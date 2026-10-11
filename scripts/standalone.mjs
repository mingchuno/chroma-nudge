import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

let html = await readFile('dist/index.html', 'utf8');
const script = html.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/);
const stylesheet = html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/);
if (!script || !stylesheet) throw new Error('Expected one bundled script and stylesheet');
const javascript = await readFile(resolve('dist', script[1]), 'utf8');
const css = await readFile(resolve('dist', stylesheet[1]), 'utf8');
html = html.replace(
  script[0],
  () => `<script type="module">${javascript.replaceAll('</script', '<\\/script')}</script>`,
);
html = html.replace(stylesheet[0], () => `<style>${css}</style>`);
html = html.replace(
  '<head>',
  `<head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">`,
);
const notices = await readFile('THIRD_PARTY_NOTICES.md', 'utf8');
html += `\n<!--\n${notices.replaceAll('--', '—')}\n-->`;
await writeFile('dist/chroma-nudge.html', html);
console.log('Standalone app: dist/chroma-nudge.html');
