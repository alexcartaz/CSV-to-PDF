const fs = require('node:fs');
const path = require('node:path');
const csv = require('csvtojson');
const {processRawCSVs} = require('./utility-data-processing.js');
const {generatePDFs} = require('./utility-generate-pdfs.js');

/**
 * This file is used to test the functionality of the CSV-to-PDF program. It loads files locally
 * and does not invoke the SEA architecture. It is meant for rapid testing to address bugs or
 * work through the additiion of new features. Once everything is working fine, the SEA blob
 * should be built and the .exe generated from saving main.js.
 */

/**
 * This asynchronous function:
 * - grabs the data from the CSVs
 * - processes the raw CSV data is that it is structured and ready for invoice PDF generation
 * - grabs the data from all asset files (CSS, PUG Templates, Images)
 * - calls the generatePDF function and inputs the above information into it
 */
const generatePDFsFromCSVs = async function () {
  console.log('\nReading files...');

  const rawPersonnel = await csv().fromFile('personnel.csv');
  const rawJobcodes = await csv().fromFile('jobcodes.csv');
  const rawQuickbooksData = await csv().fromFile('quickbooks_data.csv');

  const individualCSS = fs.readFileSync(
    path.join('assets', 'styles', 'individual.css'),
    'utf8',
  );
  const clientCSS = fs.readFileSync(
    path.join('assets', 'styles', 'client.css'),
    'utf8',
  );
  const individualPUG = fs.readFileSync(
    path.join('assets', 'templates', 'individual.pug'),
    'utf8',
  );
  const clientPUG = fs.readFileSync(
    path.join('assets', 'templates', 'client.pug'),
    'utf8',
  );
  const logo = fs.readFileSync(path.join('assets', 'images', 'logo.png'));

  console.log('\nProcessing CSVs...');

  const processedCSVData = processRawCSVs(
    rawPersonnel,
    rawJobcodes,
    rawQuickbooksData,
  );

  console.log('\nGenerating PDFs...');

  await generatePDFs(
    processedCSVData, // All data used to populate PDFs (from CSVs)
    {individualCSS, clientCSS}, // All CSS files used to style PDFs
    {individualPUG, clientPUG}, // All PUG files used to style/generate PDFs
    {logo}, // All Images used in PDFs
  );
};

try {
  generatePDFsFromCSVs();
} catch {
  console.log('An error occurred');
}
