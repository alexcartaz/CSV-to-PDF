const csv = require('csvtojson');
const {getAsset} = require('node:sea');
const {processRawCSVs} = require('./utility-data-processing.js');
const {generatePDFs} = require('./utility-generate-pdfs.js');

// Returns a copy of the data in an ArrayBuffer.
// if main.js is not run as a SEA; eg if you do 'node main.js', this getAsset code will throw an error
// for changing core logic/functionality, it is easier to develop/test by instead reading these files directly
// however when the application is finalized and ready to be exported as an executable, this code is needed

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

  const processedCSVData = processRawCSVs(
    rawPersonnel,
    rawJobcodes,
    rawQuickbooksData,
  );

  const individualCSS = getAsset('individual.css', 'utf8');
  const clientCSS = getAsset('client.css', 'utf8');
  const individualPUG = getAsset('individual.pug', 'utf8');
  const clientPUG = getAsset('client.pug', 'utf8');
  const logo = getAsset('logo.png');

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
