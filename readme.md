# Author

<table >
  <tr>
    <td> 
      <img src="https://github.com/alexcartaz/CSV-to-PDF/assets/7451015/7bf38ef4-f861-4b59-a5a6-22a52a8ff1ea" width="100%" />
    </td>
    <td width="200px" >
      <p>Alex Carter:</p>
      <ul>
        <li>
          <a href="https://www.linkedin.com/in/alexandertcarter/" target="_blank">LinkedIn</a>
        </li>
        <li>
          <a href="https://medium.com/@AlexCartaz" target="_blank">Medium</a>
        </li>
        <li>
          <a href="https://github.com/alexcartaz" target="_blank">Github</a>
        </li>
         <li>
          <a href="https://www.threads.net/@alexcartaz" target="_blank">Threads</a>
        </li>
      </ul>
    </td>
  </tr>
</table>

# Overview

I was contracted by a small consulting company to generate invoices from a Quickbook report saved as .CSV files. This company did not have their own T&E system but was spending 20-40 hours a month manually generating and editing these invoices.

Architecting a web app was overkill as there was just 1 end user who already had access to all the input files on their local machine.

So I decided to use Node.js's new Standalone Executeable Application (SEA) functionality to package a self a contained Node application as an .exe. I could then send it to the client and they could run on their machine. No internet connection, user authentication, or other hassels needed. I was able to use modules like Pupeteer and PUG to rely on HTML + CSS + js to style and generate the PDFs just like a webapp, with some restrictions for images.

The requirements for this project included:
* Convert a .CSV Quickbooks itemized time report into invoices that could handle:
  * Multiple top-level clients (eg NASA, USDA, etc.)
  * Multiple projects
  * Multiple personnel (FTE, contractor)
  * Spanning multiple months (eg the Quickbook report could be for just 1 project in 1 month with 1 person or span 40 projects across 6 months with dozens of personnel)
* Generate monthly invoices for each project, including (1) a top-level summary cover sheet of all costs followed by (2) individual itemized invoices for each billable person on that project
* Create these invoices per provided mockup examples and spec
* Calculate total cost by factoring in personal rates, contractor multipliers, and aggregated monthly expenses
* Addition functionality beyond data provided in the Quickbooks report (see personnel.csv and jobcodes.csv); end user to:
  * Provide order of seniority to order the display of personnel on invoices
  * Provide titles
  * Provide rates (static or changing over time; eg John billed at $100/hr in Jan but $120/hr in Mar after a promotion)
  * Provide display name of personnel (sometimes fname lname in Quickbook is not correct)
  * Provide abbreviated detailed jobcodes to be used in certain places of invoices to make for better readability
* Provide some visible version control
* Provide some minimal error handling

Outcome: invoices are now generated 99% ready for submission (some voucher numbers must still be applied manually due to mandated processes), capable of creating 12 months of invoices in < 5 minutes.

# Instructions

Fork / clone

## Installation

install

## Approach

The main.js / test.js files ingest the input files, including:
* CSVs (hyperlink)
* PUG templates (hyperlink)
* CSS (hyperlink)
* Images (hyperlink)

They then call generatePDFsFromCSVs() from utility-data-processing.js which takes the raw CSV data and structures it in a way that can then be used to generate the PDFs.

All the input data is then fed into the generatePDFs() from utility-generate-pdfs.js which iterates over all the data, makes some calculations, formats the data as needed, creates the PDFs in memory, and then saves the PDFs locally.

## Testing Locally

The src/test.js file tests changes to the core functionality of the program in the utility-data-processing.js and utility-generate-pdfs.js files. This is useful because otherwise, to see the impact of code changes in these files, you would need to createa a new SEA Blob, then generate a new .exe, then run that .exe in the same folder as the CSVs. The test.js file allows us to test functionality without first packaging the entire program into an .exe.

```
cd src
node test.js
```

## Creating .exe

Using the watchMain script, we rebuild the .exe whenever any changes are made to files in the /src folder. (does it also create it when run for the first time? test. I think so)

```
npm run watchMain
```

Currently, the created .exe will have a filename resembling: 'CSVtoPDF vX.XX' where the version number is manually indicated inside the /scripts/build-main.mjs file.

## Running .exe

To test the .exe make sure it is in a folder with the following files:
* quickbooks-data.csv (this is the report downloaded from Quickbooks and renamed)
* personnel.csv
* jobcodes.csv

Then start the application. A console.log window should pop up providing messages about how far along the program is, and if there are specific errors relating to a perosn in the Quickbooks report who is not in personnel.csv, or a jobcode in the Quickbooks report that is not in jobcodes.csv, an error message will display. All other error messages currently cause the program to crash and the console.log window to poof. Future scope includes making the error handling more robust.

## Sample Output

When running the program, a folder structure is created overwriting any invoices previously generated for projects in the same month.

```
Client 1
  |__ monthYear
        |__ project 1
        |__ project 2
        |__ project n
  |__ monthYear
        |__ project n
Client n
  |__ monthYear
        |__ project n
```

<insert screenshot of console.log>

You can view a sample invoice in the /sample folder. Here is what it looks like:

<image client.pdf>
<image individual.pdf page 1>
...

## Footnotes on Node.js SEA


  
## License

[MIT](https://choosealicense.com/licenses/mit/)
