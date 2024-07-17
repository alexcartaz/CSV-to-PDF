import path from 'node:path';
import fs from 'node:fs';
import {$} from 'execa';

// this is where the codebase version is defined
const version = '1.00';
const exeFilename = `CSVtoPDF v${version}.exe`;
updateVersionNumberinReadme(version);

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

/**
 * updateVersion:
 * - this script file is the one place the version number of the .exe is currently defined
 * - this script, when run (eg when .exe is compiled) will update the Readme.md file to the correct
 *   version number
 * - main.js will read that number accordingly
 * */

function updateVersionNumberinReadme(version) {
  // Path to the .md file
  const filePath = path.join(import.meta.dirname, '..', 'README.md');

  // Read the file
  fs.readFile(filePath, 'utf8', (error, data) => {
    if (error) {
      console.error('Error reading file:', error);
      return;
    }

    // Split the file into lines
    const lines = data.split('\n');

    // Modify the first line
    lines[0] = '# CSV-to-PDF v' + version;

    // Join the lines back into a single string
    const updatedData = lines.join('\n');

    // Write the updated content back to the file
    fs.writeFile(filePath, updatedData, 'utf8', (error) => {
      if (error) {
        console.error('Error writing to Readme.md file:', error);
      }
    });
  });
}
