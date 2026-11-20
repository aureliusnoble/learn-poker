// Builds dist/learn-poker.html: the whole app as one self-contained page
// fragment (styles and script inlined), for hosts that serve a single file.
//   npm run build:artifact
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const index = await readFile(`${root}index.html`, 'utf8');
const css = await readFile(`${root}css/app.css`, 'utf8');

const bundle = await build({
  entryPoints: [`${root}js/app.js`],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  write: false,
  legalComments: 'none',
});
const js = bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

// Reuse the title and font link from index.html so the two shells cannot drift.
const title = index.match(/<title>[^<]*<\/title>/)[0];
const fonts = index.match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/)[0];

const page = `${title}
<meta name="claude:viewport-fit-sides" content="cover">
${fonts}
<style>
${css}</style>
<div id="app"></div>
<script>
${js}</script>
`;

await mkdir(`${root}dist`, { recursive: true });
await writeFile(`${root}dist/learn-poker.html`, page);
console.log(`dist/learn-poker.html  ${(page.length / 1024).toFixed(1)} KB`);
