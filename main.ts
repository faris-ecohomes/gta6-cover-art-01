// Neon Palms — gta6-cover-art-01 entry program (Node 22, standard library
// only). The entry itself is the static web app under app/: plain files a
// desktop browser runs offline, no build step and no network calls. This
// program is only the hand-in: it copies app/ and screenshots/ into the
// output directory and writes dossier.json there with the kit's vendored
// buildDossier, byte for byte the way the grader rebuilds it.
//
// Run it the way the kit prescribes, with MAKEFUN_OUTPUT_DIR standing in
// for /output outside the grader:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Try the app first with: node serve.ts  (http://localhost:8080)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps below are the scorer's own (the kit's gate values): they shape
// the dossier text and refuse anything the scorer itself would refuse —
// too many or too heavy screenshots, an app/ tree over its file, byte or
// path limits.
const dossierText = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierText);
console.log(`dossier.json written (${dossierText.length} bytes) to ${outputDir}`);
