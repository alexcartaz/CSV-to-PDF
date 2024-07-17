const process = require('node:process');
const readline = require('node:readline');
const fs = require('node:fs');
const path = require('node:path');
const csv = require('csvtojson');
const {getAsset} = require('node:sea');
const {processRawCSVs} = require('./utility-data-processing.js');
const {generatePDFs} = require('./utility-generate-pdfs.js');

const arguments_ = process.argv.slice(2); // Get command-line arguments
const isLocalEnv = arguments_[0]; // Get the first argument

const version = getVersionNumberFromReadme();

// Returns a copy of the data in an ArrayBuffer.
// if main.js is not run as a SEA; eg if you do 'node main.js', this getAsset code will throw an error
// for changing core logic/functionality, it is easier to develop/test by instead reading these files directly
// however when the application is finalized and ready to be exported as an executable, this code is needed

/**
 * Setup for error handling:
 * - error catching when .exe is run
 */
process.on('uncaughtException', (error) => {
  console.error('There was an uncaught error', error);
  waitForUserInput();
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  waitForUserInput();
});

/**
 * This asynchronous function:
 * - grabs the data from the CSVs
 * - processes the raw CSV data is that it is structured and ready for invoice PDF generation
 * - grabs the data from all asset files (CSS, PUG Templates, Images)
 * - calls the generatePDF function and inputs the above information into it
 */
const generatePDFsFromCSVs = async function () {
  const rawPersonnel = await csv().fromFile('personnel.csv');
  const rawJobcodes = await csv().fromFile('jobcodes.csv');
  const rawQuickbooksData = await csv().fromFile('quickbooks_data.csv');

  let individualCSS;
  let clientCSS;
  let individualPUG;
  let clientPUG;
  let logo;

  if (isLocalEnv) {
    individualCSS = fs.readFileSync(
      path.join('assets', 'styles', 'individual.css'),
      'utf8',
    );
    clientCSS = fs.readFileSync(
      path.join('assets', 'styles', 'client.css'),
      'utf8',
    );
    individualPUG = fs.readFileSync(
      path.join('assets', 'templates', 'individual.pug'),
      'utf8',
    );
    clientPUG = fs.readFileSync(
      path.join('assets', 'templates', 'client.pug'),
      'utf8',
    );
    logo = fs.readFileSync(path.join('assets', 'images', 'logo.png'));
  } else {
    individualCSS = getAsset('individual.css', 'utf8');
    clientCSS = getAsset('client.css', 'utf8');
    individualPUG = getAsset('individual.pug', 'utf8');
    clientPUG = getAsset('client.pug', 'utf8');
    logo = getAsset('logo.png');
  }

  try {
    const processedCSVData = await processRawCSVs(
      rawPersonnel,
      rawJobcodes,
      rawQuickbooksData,
    );
    await generatePDFs(
      processedCSVData, // All data used to populate PDFs (from CSVs)
      {individualCSS, clientCSS}, // All CSS files used to style PDFs
      {individualPUG, clientPUG}, // All PUG files used to style/generate PDFs
      {logo}, // All Images used in PDFs
    );
  } catch (error) {
    console.log('Error in main function:', error);
    waitForUserInput();
  }
};

generatePDFsFromCSVs();

/**
 * Auto terminate stopper:
 * - This program has no real GUI. When the .exe is launched, a terminal window opens and
 * console.logs show the progress the program is making
 * - If the program completes successfully, or if the program errors out, we prevent the window
 * from instantly poof'ing by waiting for user input
 */
function waitForUserInput() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Press Enter to exit...', () => {
    rl.close();
    process.exit(0);
  });
}

/**
 * .exe version number:
 * - version is exported to utility-generate-pdf for cache folder checking / creating
 * - version is also hardcoded in scripts/build-main.mjs
 * - while it's not ideal to have 2 version numbers that need to be sync'd hardcoded in 2 separate
 *   places, imports can exist between build-main.mjs and the compiled repo bc circular reference
 * */

function getVersionNumberFromReadme() {
  // Path to the .md file
  const filePath = path.join(__dirname, '..', 'README.md');

  // Read the file
  fs.readFile(filePath, 'utf8', (error, data) => {
    if (error) {
      console.error('Error reading file:', error);
      return;
    }

    // Split the file into lines
    const lines = data.split('\n');
    const version = lines[0].slice(lines[0].indexOf('.') - 2);
    console.log(version);
  });
}

module.exports = {version};
