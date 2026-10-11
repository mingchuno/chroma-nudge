import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

await rm('pages', { recursive: true, force: true });
await mkdir('pages');
await cp('public', 'pages', { recursive: true });
let html = await readFile('dist/chroma-nudge.html', 'utf8');
html = html.replace('img-src data: blob:;', "img-src 'self' data: blob:; manifest-src 'self';");
html = html.replace(
  '</head>',
  `<link rel="manifest" href="./manifest.webmanifest" />
<link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png" /></head>`,
);
await writeFile('pages/index.html', html);
await writeFile('pages/.nojekyll', '');
console.log('GitHub Pages artifact: pages/');
