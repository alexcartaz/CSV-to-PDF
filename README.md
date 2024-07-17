# CSV-to-PDF v1.00

# About

<table >
  <tr>
    <td>
      <img src="https://github.com/user-attachments/assets/4f8a3620-18e3-4f34-830c-50df4ecd52a7" width="100%" />
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
      </ul>
    </td>
  </tr>
</table>


# Overview

I was contracted by a small consulting company to generate invoices from a Quickbook report saved as a .CSV file. This company did not have their own T&E system but was spending 20-40 hours a month manually generating and editing these invoices.

Architecting a web app was overkill as there was just 1 end user who already had access to all the input files on their local machine.

So I decided to use Node.js's new Standalone Executeable Application (SEA) functionality to package a self a contained Node application as an .exe. I could then send it to the client and they could run on their machine. No internet connection, user authentication, or other hassels needed. I was able to use modules like Puppeteer and PUG to rely on HTML + CSS + js to style and generate the PDFs just like a web app, with some restrictions for images.

I abstracted my work, replacing all client-sensitive files with Game of Thrones themed data, so that I could showcase this work to prospective employers. One day I may create a simplified repo with all the business requirements code removed that is a more straightforward tutorial for only CSV to PDF conversion.


## Business Requirements:

- Windows compatibility (client was a Windows shop; <b>Mac compatibility has not yet been tested/attempted</b>) 
- Convert a .CSV Quickbooks itemized time report into invoices that could handle:
  - Multiple top-level clients (eg NASA, USDA, etc.)
  - Multiple projects (eg Kennedy Space Center 2023, Space Station 2024, etc.) 
  - Multiple personnel (FTE, contractor)
  - Spanning multiple months (eg the Quickbook report could be for just 1 project in 1 month with 1 person or span 40 projects across 6 months with dozens of personnel)
- Generate monthly invoices for each project, including (1) a top-level summary cover sheet of all costs followed by (2) individual itemized invoices for each billable person on that project
- Create these invoices per provided mockup examples and spec
- Calculate total cost by factoring in personal rates, contractor multipliers, and aggregated monthly expenses
- Additional functionality beyond data provided in the Quickbooks report (see personnel.csv and jobcodes.csv); end user to:
  - Provide order of seniority to order the display of personnel on invoices (eg 1. CEO, 2. Director of Policy, etc.)
  - Provide titles
  - Provide rates (static or changing over time; eg John billed at $100/hr in Jan but $120/hr in Mar after a promotion)
  - Provide display name of personnel (sometimes fname lname in Quickbook is not correct)
  - Provide abbreviated detailed jobcodes to be used in certain places of invoices to make for better readability when normal Quickbooks jobcobe is too many characters
- Provide some visible version control
- Provide some minimal error handling


Outcome: invoices are now generated 99% ready for submission (some voucher numbers must still be applied manually due to legacy processes), capable of creating 12 months (hundreds) of invoices in < 5 minutes.


# Instructions

## Installation

```
git clone https://github.com/alexcartaz/CSV-to-PDF
cd CSV-to-PDF
npm install
```


## Approach

When main.js is run, one of the first things it does is look for `personnel.csv`, `jobcodes.csv`, and `quickbooks_data.csv`. These CSVs are meant to exist in the same folder the .exe does on the client's local machine. `personnel.csv` and `jobcodes.csv` contain client specific information the Quickbooks report is missing, but that is needed to complete some business requirements for invoice generation. With these files being local, the end user can add project codes, FTEs, contractors, and change any other information, such as billable rates, as needed. Then, whenever the end user needs to run a new report, they simply replace quickbooks_data.csv with whatever Quickbooks itemized time report they just downloaded, and then run the .exe, which will replace or add appropriate folders and pdfs in an invoice folder adjascent to the .exe.

When main.js is run:

First, the CSVs are loaded. 

Second the CSV data is processed by calling `processRawCSVs()` from `utility-data-processing.js`; structuring all of it into one object so that it can be used to generate PDFs.

The project relies on PUG, CSS, and image "Asset" files to style and create the PDF invoices; these files are bundled inside the .exe when it's compiled.
- [CSVs](https://github.com/alexcartaz/CSV-to-PDF/tree/main/src)
- [PUG](https://github.com/alexcartaz/CSV-to-PDF/tree/main/src/assets/templates)
- [CSS](https://github.com/alexcartaz/CSV-to-PDF/tree/main/src/assets/styles)
- [Images](https://github.com/alexcartaz/CSV-to-PDF/tree/main/src/assets/images)

Third, after the CSVs are processed, `generatePDFsFromCSVs()` is called from `utility-data-processing.js` which iterates over the structured data and invokes puppeteer to create the PDFs buffers in memory, and then save them locally.


## Testing Locally (Dev Env)

Bundling the .exe takes a few seconds so when in development mode, it's much easier to test changes by running the code locally. To do this, from the project root in terminal, you can call:

```
cd src
node main.js local
```

This will load the "Asset" files through fs rather than the Node SEA Asset bundler (which only works on .exe compile).


## Creating .exe

By running the `watchMain` script from the project root, we rebuild the .exe whenever any changes are made to files in the `/src` folder, `scripts/main-build.mjs`, or `main-sea-config.json`, as well as when this watch script is first run.

```
npm run watchMain
```

Currently, the created .exe will have a filename resembling: 'CSVtoPDF vX.XX' where the version number is manually hardcoded inside the `/scripts/build-main.mjs` file, which is saved to the first line of the Readme.md file upon bundling (and later referenced by the program when installing chrome browsers).


## Running .exe

To test the .exe make sure it is in a folder with the following files:

- `quickbooks-data.csv` (this is the report downloaded from Quickbooks and renamed)
- `personnel.csv`
- `jobcodes.csv`

Then start the application. A console.log window should pop up providing messages about how far along the program is. If a person is in the Quickbooks report not listed in the personnel.csv, or if a jobcode is in the Quickbooks report that is not in the jobcodes.csv, specific error messages will be thrown so the user can update the files. All other error messages *should* be caught in a try catch block, and a waitForUserInput function should allow the end user to see the error message before the program closes.


## Sample Output

When running the program, a folder structure is created overwriting any invoices previously generated for projects in the same month.

```
Client 1
  |__ monthYear
  |     |__ project 1
  |     |__ project 2
  |     |__ project n
  |__ monthYear
        |__ project n
Client n
  |__ monthYear
        |__ project n
```

![screenshot of console.log'd folder structure](https://github.com/user-attachments/assets/cf7080a4-15ce-40b7-99de-e04d9aa9a9a9)


You can view a [sample invoice](https://github.com/alexcartaz/CSV-to-PDF/blob/main/sample/D-19%20003%20Planning.pdf) in the `/sample` folder.

Here is what the invoice PDFs look like:

Client Invoice

> ![Screenshot 2024-07-17 150802](https://github.com/user-attachments/assets/14e53b2b-426e-4db1-9755-f505085e6ca8)

Cerese Lannister Invoice

> ![Screenshot 2024-07-17 150823](https://github.com/user-attachments/assets/256d2507-2b0d-44ed-b49f-37935d065b5a)


## Footnotes on Node.js SEA

I started by following the [documentation instructions](https://nodejs.org/api/single-executable-applications.html) for SEA from Node.js.

However it turns out that vanilla Node SEA does not support the inclusion of non-Node modules, so I had to add a `main-build.mjs` script step using `esbuild` that bundled my entire project, with all modules and recursive dependencies, in `dist/main.js` and then have the SEA blob build from that.

## Possible Future to Do

- Make CLI more user friendly and use a library to parse args and pass in enviornment with environment variable
- Improve scripts
- Mac and cross platform compatibility
- GUI
- Restructure utility.js files so that functions are declared vs defined, so support functions can be pushed to bottom of the file and the core logical path (primary functionality) can be placed at the top of file
- Create a separate repo removing the business requirement specific code and create more simple examples for just CSV to PDF functionality

## License

[MIT](https://choosealicense.com/licenses/mit/)
