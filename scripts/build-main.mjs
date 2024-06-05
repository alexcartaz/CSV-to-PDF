import path from 'node:path';
import {$} from 'execa';

const version = 'v1.00';
const exeFilename = 'CSVtoPDF ' + version + '.exe';

const $$ = $({
  // path.join segment means this script always runs one folder above current location
  cwd: path.join(import.meta.dirname, '..'),
  // build.mjs is parent node
  // each await$$ is a child process
  // so this dumps logs of children out to parent
  // connect standard io of child process to parent process
  stdio: 'inherit',
});

await $$`esbuild src/main.js --bundle --platform=node --outfile=dist/main.js`;
await $$`node --experimental-sea-config main-sea-config.json `;
await $$`node -e require("fs").copyFileSync(process.execPath,"${exeFilename}")`;
await $$`npx postject ${exeFilename} NODE_SEA_BLOB main-sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`;
