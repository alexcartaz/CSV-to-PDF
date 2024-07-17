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

The project relies on PUG, CSS, and image "Asset" files to style and create the PDF invoices; these files are bundled inside the .exe when it's compiled.
- [CSVs](https://github.com/alexcartaz/CSV-to-PDF/tree/main/src)
- [PUG](https://github.com/alexcartaz/CSV-to-PDF/tree/main/src/assets/templates)
- [CSS](https://github.com/alexcartaz/CSV-to-PDF/tree/main/src/assets/styles)
- [Images](https://github.com/alexcartaz/CSV-to-PDF/tree/main/src/assets/images)

They then call `generatePDFsFromCSVs()` from `utility-data-processing.js` which takes the raw CSV data and structures it in a way that can then be used to generate the PDFs.

All the input data is then fed into the `generatePDFs()` from `utility-generate-pdfs.js` which iterates over all the data, makes some calculations, formats the data as needed, creates the PDFs in memory, and then saves the PDFs locally.

## Testing Locally

The `src/test.js` file tests changes to the core functionality of the program in `the utility-data-processing.js` and `utility-generate-pdfs.js` files. This is useful because otherwise, to see the impact of code changes in these files, you would need to createa a new SEA Blob, then generate a new .exe, then run that .exe in the same folder as the CSVs. The test.js file allows us to test functionality without first packaging the entire program into an .exe.

```
cd src
node test.js
```

## Creating .exe

Using the watchMain script, we rebuild the .exe whenever any changes are made to files in the `/src` folder, `scripts/main-build.mjs`, or `main-sea-config.json`, as well as when this watch script is first run.

```
npm run watchMain
```

Currently, the created .exe will have a filename resembling: 'CSVtoPDF vX.XX' where the version number is manually indicated inside the `/scripts/build-main.mjs` file.

## Running .exe

To test the .exe make sure it is in a folder with the following files:

- `quickbooks-data.csv` (this is the report downloaded from Quickbooks and renamed)
- `personnel.csv`
- `jobcodes.csv`

Then start the application. A console.log window should pop up providing messages about how far along the program is. If a person is in the Quickbooks report not listed in the personnel.csv, or if a jobcode is in the Quickbooks report that is not in the jobcodes.csv, specific error messages will be thrown so the user can update the files. All other error messages currently cause the program to crash and the console.log window to poof. Future scope includes making the error handling more robust.

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

<insert screenshot of console.log>

You can view a [sample invoice](https://github.com/alexcartaz/CSV-to-PDF/blob/main/sample/D-22%20001%20Admin.pdf) in the `/sample` folder.

Here is what it looks like, rendering a screenshot of each individual templated invoice that eventually get merged into a single project invoice for a given month:

Client Invoice

> ![client](https://github.com/alexcartaz/CSV-to-PDF/assets/7451015/2970771d-01d9-4ec2-82cd-1479e8b6c6bd)

John Smith Invoice

> ![smith](https://github.com/alexcartaz/CSV-to-PDF/assets/7451015/f8ef1a2c-d47a-4185-9099-f714f9808106)

Brandon Horne Invoice

> ![horne](https://github.com/alexcartaz/CSV-to-PDF/assets/7451015/05504026-4b93-4e4d-b3a1-55a0376526fb)

Kathyn Mayfly Invoice

> ![mayfly](https://github.com/alexcartaz/CSV-to-PDF/assets/7451015/32d0e4a7-ac9b-4222-b5a3-3bf4cb82a3c3)

Jonathon Taylor Thomas Invoice

> ![jtt](https://github.com/alexcartaz/CSV-to-PDF/assets/7451015/b4733d14-f598-4bbf-9e5e-5101929f0f59)

Xander Cartaz Invoice

> ![xander](https://github.com/alexcartaz/CSV-to-PDF/assets/7451015/0e3521fe-37e2-415d-9aed-c258fa72b2d3)

## Footnotes on Node.js SEA

I started by following the [documentation instructions](https://nodejs.org/api/single-executable-applications.html) for SEA from Node.js.

However it turns out that vanilla Node SEA does not support the inclusion of non-Node modules, so I had to add a `main-build.mjs` script step using `esbuild` that bundled my entire project, with all modules and recursive dependencies, in `dist/main.js` and then have the SEA blob build from that.

## License

[MIT](https://choosealicense.com/licenses/mit/)
