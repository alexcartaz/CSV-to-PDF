/* eslint-disable max-depth */
/* eslint-disable prettier/prettier */

const prompt = require("prompt-sync")({ sigint: true });

/**
 * - standard dates by client are displayed as DD/MM/YYYY
 * - all date functions can take inputs of string or date objects
 * @param {date} date 
 * @returns 
 */
const firstDayOfMonthDate = function (date) {
  date = new Date(date);
  const options = {year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC'};
  const startOfMonth = new Date(date.getUTCFullYear(), date.getUTCMonth(), 1);
  return startOfMonth.toLocaleDateString('en-US', options);
};

/**
 * - standard dates by client are displayed as DD/MM/YYYY
 * - all date functions can take inputs of string or date objects
 * @param {date} date 
 * @returns 
 */
const generateMonthYear = function (date) {
  date = new Date(date);
  const options = {month: 'short', year: 'numeric', timeZone: 'UTC'};
  return date.toLocaleDateString('en-US', options);
};

/**
 * The scope of this project was expanded from initially processing a quickbooks report in the 
 * form of a CSV from 1 client for 1 specified month, to processing a CSV from quickbooks
 * potentially spanning many months and many clients. For the end user I wrote this for, the
 * jobcodes within those QB reports vary from client to client based on which are used in the
 * same template locations for invoice generation. This function uses the jobcode CSV, maintained
 * by the end user, to correctly match main and sub jobcodes to determine the top-level client
 * name as some use jobcode_1 and jobcode_2 and others use jobcode_2 and jobcode_3. This function
 * also ensures appropriate jobcode abbreviations, specified by the end user, are used.
 * 
 *  Abbreviation hypothetical example:
 *  eg 'Debris Removal for Phase 2 Round 3 of RNC Assessment 2024' -> 'DR P2R3 2024'
 * 
 * @param {object} quickbooksTimeEntryRow 
 * @param {object} processedJobcodes 
 * @returns 
 */
const determineQuickbooksJobcodeMapping = function (
    quickbooksTimeEntryRow,
    processedJobcodes,
  ) {
    const quickbooksJobcodes = ['jobcode_1', 'jobcode_2', 'jobcode_3', 'jobcode_4'];
    for (const jobcode of quickbooksJobcodes) {
      quickbooksTimeEntryRow[jobcode] = quickbooksTimeEntryRow[jobcode].trim();
      if (quickbooksTimeEntryRow[jobcode] in processedJobcodes) {
        return {
          client: processedJobcodes[quickbooksTimeEntryRow[jobcode]].client,
          mainJobcode: processedJobcodes[quickbooksTimeEntryRow[jobcode]].mainJobcode,
          subJobcode: processedJobcodes[quickbooksTimeEntryRow[jobcode]].subJobcode,
          mainJobcodeAbbr: processedJobcodes[quickbooksTimeEntryRow[jobcode]].mainJobcodeAbbr,
          subJobcodeAbbr: processedJobcodes[quickbooksTimeEntryRow[jobcode]].subJobcodeAbbr,
        };
      }
    }

    prompt(`\nERROR jobcode not found in jobcodes.csv: 
    ${quickbooksTimeEntryRow.jobcode_1} 
    ${quickbooksTimeEntryRow.jobcode_2}
    ${quickbooksTimeEntryRow.jobcode_3}
    ${quickbooksTimeEntryRow.jobcode_4}`)
  };
  
  /**
   * Sometimes a person will have more than one row in the personnel CSV because they have had
   * a rate change. This function checks to see if more than one rate exists, and if so, determines
   * which rate to use based on the provided effectiveDate and what month this project invoice is
   * occuring.
   * @param {date} invoiceDate 
   * @param {array of {date, number}} personRates 
   * @returns {number}
   */
  const determineRate = function(invoiceDate, personRates){
    if(personRates.length === 1) return personRates[0].rate
    let appropriateRate = personRates[0].rate;
    let appropriateDate = personRates[0].effectiveDate
    let rate; let date;
    for(let i = 1; i<personRates.length; i++){
      date = personRates[i].effectiveDate;
      rate = personRates[i].rate;
      if(date > appropriateDate && date <= invoiceDate){
        appropriateDate = date;
        appropriateRate = rate;
      }
    }
  
    return appropriateRate;
  }

  const returnCompareType = function (value, type) {
    if (type === 'monthYear') {
      return new Date(value);
    }
  
    if (type === 'mainJobcode') {
      // assumes 1 Letter - 1-2 numbers
      // eg L-NN
      // convert letter to lowercase to ascii
      let newValue = value.charAt(0).toLowerCase();
      newValue = newValue.charCodeAt(0);
      // add decimal of trailing number
      // eg R-22 = ascii(r) + .22
      newValue += Number(value.slice(value.indexOf('-') + 1)) / 100;
      return newValue;
    }
  
    if (type === 'subJobcode') {
      return Number(value.slice(0, 3));
    }
  };
  
  const sortDictionaryKeys = function (dictionary, type) {
    // convert to array of key-value pairs
    // sort array
    // convert back to dict
  
    const keys = Object.entries(dictionary).map(([key]) => {
      return key;
    });
  
    return keys.sort((a, b) => {
      a = returnCompareType(a, type);
      b = returnCompareType(b, type);
      // console.log('a: ' + a);
      // console.log('b: ' + b);
      return a - b;
    });
  };
  
  /**
   * This function takes in the data contained in 3 separate CSV files and then processes / structures
   * that data so that it can be used to generate invoices in the form of PDFs. Specifically, this
   * function ingests a personnel CSV maintained by the operator of this program detailed custom
   * data missing from the Quickbook report, such as display name, rate, title, etc. Additionally,
   * the jobcodes CSV includes jobcode abbreviations that are displayed within the invoices. And
   * finally, there is the data that comes directly from an itemized quickbooks report. This function
   * returns the corresponding processed data for each file in its own dictionary.
   * @param {Object} rawPersonnel 
   * @param {Object} rawJobcodes 
   * @param {Object} rawQuickbooksData 
   * @returns {Object}
   */
  const processRawCSVs = function (rawPersonnel, rawJobcodes, rawQuickbooksData) {
  
    console.log('\nReading + processing CSVs...')
    
    // Personnel:
    // Data from the personnel CSV contains information missing from the Quickbooks report,
    // including display names (different from fname, lname in Quickbooks), rates, new rates and
    // their effective dates, titles, and custom seniority order for invoice display
  
    const personnel = {};
    personnel.contractorRate = Number(rawPersonnel[0].contractorRate);
  
    for (const i of rawPersonnel) {
  
      const key = `${i.username.trim()}`;
      if (key in personnel) {
        personnel[key].rates.push({
          effectiveDate: new Date(i.effectiveDate.trim()),
          rate: Number(i.rate.trim()),
        });
      } else {
        personnel[key] = {
          rates: [
            {
              effectiveDate: new Date('1/1/20'),
              rate: Number(i.rate.trim()),
            },
          ],
          order: Number(i.order.trim()),
          type: i.type.trim(),
          title: i.title.trim(),
          fname: i.fname.trim(),
          lname: i.lname.trim(),
          name: `${i.fname.trim()} ${i.lname.trim()}`,
        };
      }
    }
  
    // jobcodes:
    // sometimes abbreviations are needed for the long strings of jobcodes provided in Quickbooks
    // in this case, the end user must specify the main jobcode, sub jobcode, and their abbreviations
    const jobcodes = {};
    let key;
    for (const i of rawJobcodes) {
      key = i.sub_jobcode.trim();
      jobcodes[key] ||= {};
      jobcodes[key].client = i.client.trim();
      jobcodes[key].mainJobcode = i.main_jobcode.trim();
      jobcodes[key].mainJobcodeAbbr = i.main_jobcode_abbreviation.trim();
      jobcodes[key].subJobcode = i.sub_jobcode.trim();
      jobcodes[key].subJobcodeAbbr = i.sub_jobcode_abbreviation.trim();
    }
  
    // Quickbooks Data:
    // data from a templated itemized time report run from within Quickbooks; it mostly contains
    // time entry information where each row corresponds to the amount of hours billed by
    // one person (FTE or contractor) to a specific client, on a given day
    const quickbooksData = {};
    let date;
    let monthYear;
    let isExpenses;
  
    // for each time entry in the report...
    for (const i of rawQuickbooksData) {
      const {client, mainJobcode, subJobcode, mainJobcodeAbbr, subJobcodeAbbr} = 
        determineQuickbooksJobcodeMapping(i, jobcodes);
      date = new Date(i.local_date.trim());
      monthYear = generateMonthYear(date);
  
      // this .exe has been expanded to cover quickbook reports run to span multiple months and
      // multiple clients, however invoices are always grouped by subJobcode + month
      // overall data structure:
      //    client (eg HUD)
      //       MM YYYY (eg Apr 2024)
      //         main jobcode (eg State of Georgia)
      //           sub jobcode (eg City of Atlanta - Debris Assessment)
      quickbooksData[client] ||= {};
      quickbooksData[client][monthYear] ||= {};
      quickbooksData[client][monthYear][mainJobcodeAbbr] ||= {};
      quickbooksData[client][monthYear][mainJobcodeAbbr][subJobcodeAbbr] ||= {
        people: {},
        expenses: 0,
        project: {
          client,
          monthYear,
          mainJobcode,
          mainJobcodeAbbr,
          subJobcode,
          subJobcodeAbbr,
          monthStartDate: firstDayOfMonthDate(date),
        }
      };
      // i think we need a let bc we are gonna be changing this variable's data
      const projectMonth = quickbooksData[client][monthYear][mainJobcodeAbbr][subJobcodeAbbr];
      //  Expenses:
      //  maunally entered in quickbooks CSV report as a line item by end user
      //  lname column will have word 'Expenses'
      //  assumption: only 1 expense line item per subcode month pairing (they are already aggregated)
      i.lname === 'Expenses' ? (isExpenses = true) : (isExpenses = false);
      
      if (isExpenses) {
        projectMonth.expenses = Number(i.hours);
      } else {
        const key = i.username.trim();
        if(key in personnel === false){
          prompt('ERROR username missing in personnel.csv: ' + key)
        }

        const name = personnel[key].name;
        const timeEntry = {
            date,
            hours: Number(i.hours.trim()),
            serviceItem: i['service item'].trim(),
            code4: i.jobcode_4.trim(),
            notes: i.notes.trim(),
        }
  
        // add people (FTE, contractor) to a given projectMonth using their name as a dict key
        // their individual time entires are stored in an area on their data object
        
        if(name in projectMonth.people){
          projectMonth.people[name].time.push(timeEntry)
        }else{
          projectMonth.people[name] = {
            username: key,
            fname: personnel[key].fname,
            lname: personnel[key].lname,
            name,
            order: personnel[key].order,
            type: personnel[key].type,
            title: personnel[key].title,
            rate: determineRate(date, personnel[key].rates),
            time: [timeEntry],
          }
        }
      }
    }
  
    let orderedArray;
    let temporaryObject;
  
    for (const client of Object.keys(quickbooksData)) {
      for (const monthYear of Object.keys(quickbooksData[client])) {
        const projects = quickbooksData[client][monthYear];
        for (const mainJobcodeAbbr of Object.keys(projects)) {
          for (const subJobcodeAbbr of Object.keys(projects[mainJobcodeAbbr])) {
            orderedArray = [];
            for (const name of Object.keys(projects[mainJobcodeAbbr][subJobcodeAbbr].people)) {
              temporaryObject = {};
              temporaryObject = projects[mainJobcodeAbbr][subJobcodeAbbr].people[name];
              orderedArray.push(temporaryObject);
            }
  
            // Sort people by hardcoded order (seniority/importance) from CSV based on end user preferences: eg...
            // 1. John Smith, CEO
            // 2. Jane Doe, VP
            // 3. Jack Roberts, Manager
            // etc...

            orderedArray.sort((a, b) => {
              if (a.order > b.order)
                return 1;
              return -1;
            });
  
            projects[mainJobcodeAbbr][subJobcodeAbbr].people = [];
            projects[mainJobcodeAbbr][subJobcodeAbbr].people = orderedArray;
          }

          // add array of sorted subJobcode keys
          projects[mainJobcodeAbbr].sortedSubJobcodes = sortDictionaryKeys(projects[mainJobcodeAbbr], 'subJobcode');
        }

        // add array of sorted mainJobcode keys
        projects.sortedMainJobcodes = sortDictionaryKeys(projects, 'mainJobcode');
      }

      // add array of sorted monthYear keys
      quickbooksData[client].sortedMonthYears = sortDictionaryKeys(quickbooksData[client], 'monthYear');
    }

    // console.log(quickbooksData)
    return {personnel, jobcodes, quickbooksData};
  };

  module.exports = {processRawCSVs};