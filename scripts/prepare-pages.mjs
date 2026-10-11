import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';

await rm('pages', { recursive: true, force: true });
await mkdir('pages');
await copyFile('dist/chroma-nudge.html', 'pages/index.html');
await writeFile('pages/.nojekyll', '');
console.log('GitHub Pages artifact: pages/');
