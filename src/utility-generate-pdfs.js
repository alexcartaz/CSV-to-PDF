/* eslint-disable max-depth */
/* eslint-disable prettier/prettier */
const fs = require('node:fs');
const path = require('node:path');
const pug = require('pug');
const puppeteer = require('puppeteer-core');
const {PDFDocument} = require('pdf-lib');
const { version } = require('./main.js');
const prompt = require("prompt-sync")({ sigint: true });
const puppeteerBrowsers = require('@puppeteer/browsers');
const os = require('node:os');

/*
************************** UTILITY FUNCTIONS for CSV-to-PDF *****************************

  Date Functions:
  -formatDateToString
  -lastDayOfMonthDate
  -datePlus30Days

  Misc Support Functions:
  -formatNumberToString
  -extractPersonData
  -formatPersonData
  -formatTimeData
  -formatClientData
  -formatPeopleData
  -generateExpensesText
  -generateContractorText

  PDF Creation:
  -generatePDFBuffer
  -createNewFolder
  -extractClientData
  -generatePersonHtml
  -generateClientHtml
  -generateMonthProjectPDF
  -generatePDFs

*/

// ******************************** Start: Date Functions ********************************

/**
 * - standard dates by client are displayed as DD/MM/YYYY
 * - all date functions can take inputs of string or date objects
 * @param {date} date 
 * @returns 
 */
const formatDateToString = function (date) {
  date = new Date(date);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
  });
};

/**
 * - standard dates by client are displayed as DD/MM/YYYY
 * - all date functions can take inputs of string or date objects
 * @param {date} date 
 * @returns 
 */
const lastDayOfMonthDate = function (date) {
  date = new Date(date);
  const options = {year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC'};
  const endOfMonth = new Date(date.getUTCFullYear(), date.getUTCMonth() + 1, 0);
  return endOfMonth.toLocaleDateString('en-US', options);
};

/**
 * - standard dates by client are displayed as DD/MM/YYYY
 * - all date functions can take inputs of string or date objects
 * @param {date} date 
 * @returns 
 */
const datePlus30Days = function (date) {
  date = new Date(date);
  const options = {year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC'};
  date.setDate(date.getDate() + 30);
  return date.toLocaleDateString('en-US', options);
};

// ******************************** End: Date Functions ********************************

// ******************************** Start: Misc Support Functions ********************************

/**
 * Converts a number to a string formatted as: X,XXX.XX
 * @param {number} number_ 
 * @returns 
 */
const formatNumberToString = function (number_) {
  return number_.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Isolates person and time data in anticipation of generated compiled HTML for PUG templates
 * @param {object} personData 
 * @returns 
 */
const extractPersonData = function (personData) {
  const pD = personData;
  const time = pD.time;
  let totalHours = 0;
  
  for (const t of time) {
    // use one of two data sources for detailed jobcode on an individual's invoice
    t.code4 === '' ? t.lowestJobcode = t.serviceItem : t.lowestJobcode = t.code4;
    // sum individual's hours to display in invoice
    totalHours += t.hours;
  }

  const person = {
    fname: pD.fname,
    lname: pD.lname,
    name: pD.name,
    totalHours,
    order: pD.order,
    rate: pD.rate,
    type: pD.type,
    title: pD.title,
  };
  return {person, time};
};

/**
 * Formats person data dates and numbers to end user specifications (eg X,XXX.XX, MM/DD/YY, etc.)
 * @param {object} person 
 * @returns 
 */
const formatPersonData = function (person) {
  person.totalHours = formatNumberToString(person.totalHours);
  person.rate = formatNumberToString(person.rate);
  person.date = formatDateToString(person.date);
  return person;
};

/**
 * Iterates over each time entry for a person and formats dates and numbers to end user 
 * specifications (eg X,XXX.XX, MM/DD/YY, etc.)
 * @param {array} time 
 * @returns 
 */
const formatTimeData = function (time) {
  for (const t of time) {
    t.date = formatDateToString(t.date);
    t.hours = formatNumberToString(t.hours);
  }

  return time;
};

/**
 * converts numbers and dates within data object to strings for correct formatting before
 * being placed onto invoices
 * @param {object} client 
 * @returns 
 */
const formatClientData = function (client) {
  client.total = formatNumberToString(client.total);
  client.expensesQTY = formatNumberToString(client.expensesQTY);
  client.expensesAmt = formatNumberToString(client.expensesAmt);
  client.contractorQTY = formatNumberToString(client.contractorQTY);
  client.contractorAmt = formatNumberToString(client.contractorAmt);
  // contractor rate is the only number on the invoices with more than 2 decimal places
  // it is provided in the personnel CSV with 4 decimal places
  client.contractorRate = client.contractorRate.toString();
  return client;
};

/**
 * converts numbers and dates on people data objects to strings for correct formatting before
 * being placed onto invoices
 * @param {array of Object} people 
 * @returns 
 */
const formatPeopleData = function (people) {
  for (const p of people) {
    p.rate = formatNumberToString(p.rate);
    p.totalHours = formatNumberToString(p.totalHours);
    p.totalAmount = formatNumberToString(p.totalAmount);
  }

  return people;
};

/**
 * Currently this is hardcoded but was left as a function in case it becomes more complex / 
 * customizable in the future
 * @returns 
 */
const generateExpensesText = function () {
  return 'Reimbursable Expenses (see provided documentation and logs)';
};

/**
 * if contractors are present for a given client invoice, a conditional line item needs to appear 
 * on the summary (client) view of the invoice; this function creates part of that text based on 
 * user specifications. if expenses are present for this projectMonth, they too will appear
 * as a contractor item, in addition to their own line item
 * @param {array of numbers} contractorTotals 
 * @param {number} contractorRate 
 * @returns 
 */
const generateContractorText = function (
  contractorTotals,
  contractorRate,
) {
  let string_ = 'General / Admin ';
  if (contractorTotals.length > 1) string_ += '(';
  for (let i = 0; i < contractorTotals.length; i++) {
    string_ += '$' + formatNumberToString(contractorTotals[i]);
    if (i < contractorTotals.length - 1) string_ += ' + ';
  }

  if (contractorTotals.length > 1) string_ += ')';
  string_ += ' * ' + (contractorRate * 100).toString() + '%';
  return string_;
};

// ******************************** End: Misc Support Functions ********************************

// ******************************** Start: PDF Creation Function ********************************

/**
 * this function takes an html string compiled using PUG from CSS and a PUG template and then
 * uses puppeteer to convert that html into a PDF buffer in memory
 * @param {string} html 
 * @returns 
 */
const generatePDFBuffer = async function (html) {

  const cacheDir = path.join(os.homedir(), '.CSVtoPDF ' + version, 'cache');
  
  if(!fs.existsSync(cacheDir)){
    fs.mkdirSync(path.join(os.homedir(), '.CSVtoPDF ' + version));
    fs.mkdirSync(cacheDir);
  }

  const installedBrowsers = await puppeteerBrowsers.getInstalledBrowsers({cacheDir});
  let browserInfo = installedBrowsers[0];

  if(installedBrowsers.length === 0){
    browserInfo = await puppeteerBrowsers.install({
      browser: 'chrome-headless-shell',
      buildId: '126.0.6478.126',
      cacheDir,
    });
  }

  // Launch a new chrome instance
  const browser = await puppeteer.launch({
    executablePath: browserInfo.executablePath,
    headless: true
  });

  // Create a new page
  const page = await browser.newPage();
  
  await page.emulateMediaType('print');
  
  // Set your html as the pages content
  await page.setContent(html, {
    waitUntil: 'domcontentloaded',
  });
  
  // Create a pdf buffer
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true, // required for basic styling, background colors
    preferCSSPageSize: true, // required for maintaining page margins when iterating over a table > 1 page
  });
  
  // Close the browser
  await browser.close();
  
  return pdfBuffer;
};

/**
 * if the specified folder already exists at path, delete it. then create it from scratch
 * this overwrites any old data; end user may need to re-run this program when generating invoices
 * @param {string} currentPath 
 */
const createNewFolder = function(currentPath, overwrite){
  if (fs.existsSync(currentPath)) {
    if(overwrite){
      fs.rmSync(currentPath, {recursive: true});
      fs.mkdirSync(currentPath);
    }
  }else{
    fs.mkdirSync(currentPath);
  }
}

/**
 * determines data needed for the "client" invoice, eg the rolled up aggregated top-level
 * invoice summary pdf
 * @param {object} project 
 * @param {number} expenses 
 * @param {object} amountVariables_ 
 * @property {number} contractorRate
 * @property {number} clientTotalAmount 
 * @property {number} contractorTotalAmount 
 * @property {array} contractorAmounts 
 * @returns 
 */
const extractClientData = function(project, expenses, amountVariables_){
  const lastDayOfMonth = lastDayOfMonthDate(project.monthStartDate);
  return {
      mainJobcode: project.mainJobcode,
      lastDayOfMonth,
      lastDayofMonthPlus30Days: datePlus30Days(lastDayOfMonth),
      subJobcode: project.subJobcode,
      monthYear: project.monthYear,
      total: amountVariables_.clientTotalAmount,
      expenses: expenses > 0,
      expensesDesc: generateExpensesText(),
      expensesQTY: 1,
      expensesRate: expenses,
      expensesAmt: expenses,
      contractor: amountVariables_.contractorTotalAmount > 0,
      contractorDesc: generateContractorText(amountVariables_.contractorAmounts, amountVariables_.contractorRate),
      contractorQTY: amountVariables_.contractorTotalAmount,
      contractorRate: amountVariables_.contractorRate,
      contractorAmt: amountVariables_.contractorTotalAmount * amountVariables_.contractorRate,
    };
}


/**
 * This function generates the HTML used to later generate the PDF for the pages of the invoices
 * dedicated to individual personnel's time entires. JSON functions are used when formatting this
 * data to remove reference to the original object so that formatting these values for number/date
 * displays does not change the actual value within the object
 * ------------project data may not need to be formatted --------------------------------------------------------------------------
 * ------------these functions are similar but not sure how to easily abstract them into one combined function --------------------
 * @param {string} individualCSS 
 * @param {object} individualPUG 
 * @param {object} person 
 * @param {array} time 
 * @param {object} formattedProjectData 
 * @returns 
 */
const generatePersonHtml = function(individualCSS, individualPUG, person, time, project){
  
  const formattedPersonData = formatPersonData(
    JSON.parse(JSON.stringify(person)),
  );

  const formattedTimeData = formatTimeData(
    JSON.parse(JSON.stringify(time)),
  );
  
  const compiledIndividual = pug.compile(individualPUG);
 
  const html = compiledIndividual({
    individualCSS,
    formattedPersonData,
    formattedTimeData,
    formattedProjectData: project,
  });
  
  return html;
}

/**
 * This function generates the HTML used to later generate the PDF for the top level pages of the 
 * invoices dedicated to client projectMonth summaries. JSON functions are used when formatting this
 * data to remove reference to the original object so that formatting these values for number/date
 * displays does not change the actual value within the object
 * @param {string} clientCSS 
 * @param {object} clientPUG 
 * @param {object} client 
 * @param {array of object} persons 
 * @returns 
 */
const generateClientHtml = function(clientCSS, clientPUG, client, persons){
  
  const formattedClientData = formatClientData(
    JSON.parse(JSON.stringify(client)),
  );

  const formattedPeopleData = formatPeopleData(
    JSON.parse(JSON.stringify(persons)),
  );

  const compiledClient = pug.compile(clientPUG);

  const html = compiledClient({
    clientCSS,
    formattedClientData,
    formattedPeopleData,
  });

  return html;
}

/**
 * This function takes all the processed and formatted people data, people html, client data, and 
 * client html, as well as the image buffer of the client's logo, and uses them to generate the
 * merged bytes for the final PDF in memory, and returns it
 * @param {arry of object} persons 
 * @param {string} clientHtml 
 * @param {object} logo 
 * @returns {object} 
 */
const generateMonthProjectPDF = async function(persons, clientHtml, logo){
  
  let pdfBuffer;
  
  await Promise.all(
    persons.map(async (person) => {
      pdfBuffer = await generatePDFBuffer(person.html);
      person.pdf = await PDFDocument.load(pdfBuffer);
    }),
  );
  
  const mergedPdfDocument = await PDFDocument.create();
  const clientPDFBuffer = await generatePDFBuffer(clientHtml);
  const clientPDF = await PDFDocument.load(clientPDFBuffer);

  // cannot use HTML/CSS to render images with PUG + Puppeteer in a PDF
  // manual image manipulation to place globally (x,y) in correct position + scale; 
  // can only use PNG images
  const image = await clientPDF.embedPng(logo);
  const imageDims = image.scale(0.15);
  const pages = clientPDF.getPages();
  const page = pages[0];
  page.drawImage(image, {
    x: 35,
    y: 740,
    width: imageDims.width,
    height: imageDims.height,
  });
  await clientPDF.save();

  // each client invoice starts with the top-level client template PDF
  const pdfs = [clientPDF];

  // then we append with individual PDF templates listing each persons hours that month
  for (const person of persons) {
    pdfs.push(person.pdf);
  }

  // pdfs array contains PDF buffers for 1 client template and n individual templates
  // but they are not merged into 1 PDF document yet
  // copyPages so that they can be
  for (const pdf of pdfs) {
    const copiedPages = await mergedPdfDocument.copyPages(
      pdf,
      pdf.getPageIndices(),
    );
    // add pages to empty mergedPdfDocument so now all PDFs are in the same PDF buffer
    for (const page of copiedPages) mergedPdfDocument.addPage(page);
  }

  const mergedPdfBytes = await mergedPdfDocument.save();

  return mergedPdfBytes;
}

/**
 * This function takes the unordered monthYear under a client in the main data dictionary
 * and orders them so that as the user is seeing monthYears in the console log as PDFs
 * are being made, it is in chronological order and not confusing
 * @param {object} monthYears 
 * @returns 
 */
const orderMonthYearDates = function(monthYears){
  const sortedDictionary = {};
  const array = [];

  for (const [key, value] of Object.entries(monthYears)) {
    array.push([key, value]);
  }

  // a[0] = key = 'MMM YYYY'
  // a[1] = value = {object}
  array.sort((a, b) => {
    if (new Date(a[0]) > new Date(b[0])) return 1;
    return -1;
  });

  for (const item of array) {
    sortedDictionary[item[0]] = item[1];
  }

  return sortedDictionary;
}

/**
 * This function takes in all project inputs: CSV data, PUG templates, CSS files, images, etc.
 * and uses them to generate invoice PDFs
 * @param {object} param0 processed data from each CSV
 * @param {object} param1 CSS files
 * @param {object} param2 PUG templates
 * @param {object} param3 additional assets, eg images
 */
const generatePDFs = async function (
  {personnel, jobcodes, quickbooksData}, // all csv (processed) data
  {individualCSS, clientCSS}, // all CSS files
  {individualPUG, clientPUG}, // all PUG files
  {logo}, // all image files
) {

  console.log('\nBeginning PDF generation...') // for end user to know what program is currently doing

  console.log('\nInvoices')
  
  let currentPath = path.join(__dirname, 'Invoices')
  createNewFolder(currentPath, false);

  // for each top-level client (eg HUD, NASA, etc.)
  for(const clientName of Object.keys(quickbooksData)){
    
    console.log('  ' + clientName) // for end user to know what program is currently doing
    currentPath = path.join(__dirname, 'Invoices', clientName)
    createNewFolder(currentPath, false);
    quickbooksData[clientName] = orderMonthYearDates(quickbooksData[clientName])
    // for each monthYear (eg invoices for Apr 2024)
    for(const monthYear of quickbooksData[clientName].sortedMonthYears){
      
      console.log('    ' + monthYear) // for end user to know what program is currently doing
      currentPath = path.join(__dirname, 'Invoices', clientName, monthYear)
      createNewFolder(currentPath, true);
      const projects = quickbooksData[clientName][monthYear];

      // for each arbitrary main jobcode (eg Debris Assessment)
      for(const mainJobcode of projects.sortedMainJobcodes){

        // for each arbitrary sub jobcode (eg City of Atlanta)
        for(const subJobcode of projects[mainJobcode].sortedSubJobcodes){

          const expenses = projects[mainJobcode][subJobcode].expenses;
          const project = projects[mainJobcode][subJobcode].project;
          const contractorRate = personnel.contractorRate;
          const persons = [];

          let clientTotalAmount = 0;
          let contractorTotalAmount = 0;
          const contractorAmounts = [];
          let personTotalAmount;
          
          // for each person (FTE, contractor) billing time within this projectMonth
          for (const personData of projects[mainJobcode][subJobcode].people) {

            const {person, time} = extractPersonData(personData);
            const personHtml = generatePersonHtml(individualCSS, individualPUG, person, time, project);
            personTotalAmount = person.rate * person.totalHours;

            // each item in this array will correspond to at least 1 dedicated PDF invoice page
            persons.push({
              html: personHtml,
              name: person.fname + ' ' + person.lname,
              rate: person.rate,
              totalHours: person.totalHours,
              totalAmount: personTotalAmount,
              title: person.title,
            });

            clientTotalAmount += personTotalAmount;

            // contractor hours need to be tracked separately as they have an additional rate applied
            if (person.type !== 'FTE') {
              contractorTotalAmount += personTotalAmount;
              contractorAmounts.push(personTotalAmount);
            }
          }

          // expenses warrant their own line item; need to be tracked separately
          if (expenses > 0) {
            contractorTotalAmount += expenses;
            contractorAmounts.push(expenses);
          }

          clientTotalAmount += contractorTotalAmount * contractorRate;

          const client = extractClientData(project, expenses, {
            contractorRate, clientTotalAmount, contractorTotalAmount, contractorAmounts});
          const clientHtml = generateClientHtml(clientCSS, clientPUG, client, persons);
          
          const mergedPdfBytes = await generateMonthProjectPDF(persons, clientHtml, logo)
          const filename = mainJobcode + ' ' + subJobcode + '.pdf';
          
          console.log('      ' + filename); // for end user to know what the program is currently doing
          
          currentPath = path.join(__dirname, 'Invoices', clientName, monthYear, filename)
          fs.writeFileSync(currentPath, mergedPdfBytes);
        }
      }
    }
  }

  prompt('Done! Check the Invoices folder for the new PDFs. (Press ENTER to close)');
}

// ******************************** End: PDF Creation Functions ********************************

module.exports = {generatePDFs};
