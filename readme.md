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

I was contracted by a small consulting company to help them generate invoices from Quickbook reports saved as .CSV files. This company did not have their own T&E system but was spending 20-40 hours a month manually generating and editing these invoices.

Architecting a web app was overkill as there was just 1 client with 1 end user who already had access to all the input files they needed on their local machine.

So I decided to use Node.js's new Standalone Executeable Application (SEA) functionality to package a self a contained Node application as an .exe I could send to the client and they could run on their machine. No internet connection, user authentication, or other hassels needed. I was able to use modules like Pupeteer and PUG to rely on HTML + CSS to style and generate the PDFs just like a webapp, with some restrictions.

The requirements for this project included:
* Convert a .csv Quickbooks itemized time report into multiple invoices for many projects under multiple clients, spanning multiple months
* Create a cover sheet top-level invoice for each project under the client per month, with subsequent invoices of itemized time for each billable person in that project
* Create these invoices per procided mockup examples and spec
* Calculate total cost by factoring in personal rates, contractor multipliers, and aggregated monthly expenses
* List personnel in a specified order of seniority on invoices, and include titles and the ability to overwrite fname and lname in the Quickbooks report
* Allow for the end user to also overwrite project detailed jobcodes for select apperance on the invoices (usually abbreviated more human readable jobcodes)
* Provide some visible version control
* Provide some minimal error handling

Outcome: invoices are now generated 99% ready for submission (some voucher numbers must still be applied manually due to mandated processes), creating 6+ months worth in < 5 minutes.

# Instructions

## Tech Stack

Languages: HTML, CSS, JavaScript\
Environment: Node.js (Express)\
Frameworks: React (Router, Dom, Markdown)\
Database: SQLite (ORM Sequelize)\
Tools: nodemon, axios, js-cookie

## Sample Output

a

## License

[MIT](https://choosealicense.com/licenses/mit/)
