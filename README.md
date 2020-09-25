# pdfreader ![Node CI](https://github.com/adrienjoly/npm-pdfreader/workflows/Node%20CI/badge.svg) [![Code Quality](https://api.codacy.com/project/badge/Grade/73d37dbb0ff84795acf65a55c5936d83)](https://www.codacy.com/app/adrien-joly/npm-pdfreader?utm_source=github.com&utm_medium=referral&utm_content=adrienjoly/npm-pdfreader&utm_campaign=Badge_Grade)

Read text and parse tables from PDF files.

Supports **tabular data** with automatic column detection, and **rule-based parsing**.

Dependencies: it is based on [pdf2json](https://www.npmjs.com/package/pdf2json), which itself relies on Mozilla's [pdf.js](https://github.com/mozilla/pdf.js/).

ℹ️ This module is meant to be run using Node.js only. **It does not work from a web browser.**

Summary:

- [Installation, tests and CLI usage](#installation-tests-and-cli-usage)
- [Raw PDF reading](#raw-pdf-reading) (incl. examples)
- [Rule-based data extraction](#rule-based-data-extraction)
- [Troubleshooting & FAQ](#troubleshooting--faq)

## Installation, tests and CLI usage (make sure node v8 or v10)

    npm install pdfreader
    cd node_modules/pdfreader
    npm test
    node parse.js test/sample.pdf

## Raw PDF reading

This module exposes the `PdfReader` class, to be instantiated.

Your instance has two methods for parsing a PDF. They return the same output and differ only in input: `PdfReader.parseFileItems` (as below) for a filename, and `PdfReader.parseBuffer` (see: "Raw PDF reading from a PDF already in memory (buffer)") from data that you don't want to reference from the filesystem.

Whichever method you choose, it asks for a callback, which gets called each time the instance finds what it denotes as a PDF item.

An item object can match one of the following objects:

- `null`, when the parsing is over, or an error occured.
- File metadata, `{file:{path:string}}`, when a PDF file is being opened, and is always the first item.
- Page metadata, `{page:integer, width:float, height:float}`, when a new page is being parsed, provides the page number, starting at 1. This basically acts as a carriage return for the coordinates of text items to be processed.
- Text items, `{text:string, x:float, y:float, w:float, h:float...}`, which you can think of as simple objects with a text property, and floating 2D AABB coordinates on the page.

It's up to your callback to process these items into a data structure of your choice, and also to handle any errors thrown to it.

For example:

```javascript
new PdfReader().parseFileItems("sample.pdf", function (err, item) {
  if (err) callback(err);
  else if (!item) callback();
  else if (item.text) console.log(item.text);
});
```

### Raw PDF reading from a PDF already in memory (buffer)

As above, but reading from a buffer in memory rather than from a file referenced by path. For example:

```javascript
var fs = require("fs");
fs.readFile("sample.pdf", (err, pdfBuffer) => {
  // pdfBuffer contains the file content
  new PdfReader().parseBuffer(pdfBuffer, function (err, item) {
    if (err) callback(err);
    else if (!item) callback();
    else if (item.text) console.log(item.text);
  });
});
```

### Example: reading from a buffer of an online PDF

```javascript
const https = require("https");
const pdfreader = require("pdfreader");

async function bufferize(url) {
  var hn = url.substring(url.search("//") + 2);
  hn = hn.substring(0, hn.search("/"));
  var pt = url.substring(url.search("//") + 2);
  pt = pt.substring(pt.search("/"));
  const options = { hostname: hn, port: 443, path: pt, method: "GET" };
  return new Promise(function (resolve, reject) {
    var buff = new Buffer.alloc(0);
    const req = https.request(options, (res) => {
      res.on("data", (d) => {
        buff = Buffer.concat([buff, d]);
      });
      res.on("end", () => {
        resolve(buff);
      });
    });
    req.on("error", (e) => {
      console.error("https request error: " + e);
    });
    req.end();
  });
}

/*
if second param is set then a space ' ' inserted whenever text
chunks are separated by more than xwidth
this helps in situations where words appear separated but
this is because of x coords (there are no spaces between words)

each page is a different array element
*/
async function readlines(buffer, xwidth) {
  return new Promise((resolve, reject) => {
    var pdftxt = new Array();
    var pg = 0;
    new pdfreader.PdfReader().parseBuffer(buffer, function (err, item) {
      if (err) console.log("pdf reader error: " + err);
      else if (!item) {
        pdftxt.forEach(function (a, idx) {
          pdftxt[idx].forEach(function (v, i) {
            pdftxt[idx][i].splice(1, 2);
          });
        });
        resolve(pdftxt);
      } else if (item && item.page) {
        pg = item.page - 1;
        pdftxt[pg] = [];
      } else if (item.text) {
        var t = 0;
        var sp = "";
        pdftxt[pg].forEach(function (val, idx) {
          if (val[1] == item.y) {
            if (xwidth && item.x - val[2] > xwidth) {
              sp += " ";
            } else {
              sp = "";
            }
            pdftxt[pg][idx][0] += sp + item.text;
            t = 1;
          }
        });
        if (t == 0) {
          pdftxt[pg].push([item.text, item.y, item.x]);
        }
      }
    });
  });
}

(async () => {
  var url =
    "https://www.w3.org/TR/2011/NOTE-WCAG20-TECHS-20111213/working-examples/PDF2/bookmarks.pdf";
  var buffer = await bufferize(url);
  var lines = await readlines(buffer);
  lines = await JSON.parse(JSON.stringify(lines));
  console.log(lines);
})();
```

### Example: parsing lines of text from a PDF file

![example cv resume parse convert pdf to text](https://github.com/adrienjoly/npm-pdfreader-example/raw/master/parseRows.png)

Here is the code required to convert this PDF file into text:

```js
var pdfreader = require("pdfreader");

var rows = {}; // indexed by y-position

function printRows() {
  Object.keys(rows) // => array of y-positions (type: float)
    .sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
    .forEach((y) => console.log((rows[y] || []).join("")));
}

new pdfreader.PdfReader().parseFileItems("CV_ErhanYasar.pdf", function (
  err,
  item
) {
  if (!item || item.page) {
    // end of file, or page
    printRows();
    console.log("PAGE:", item.page);
    rows = {}; // clear rows for next page
  } else if (item.text) {
    // accumulate text items into rows object, per line
    (rows[item.y] = rows[item.y] || []).push(item.text);
  }
});
```

Fork this example from [parsing a CV/résumé](https://github.com/adrienjoly/npm-pdfreader-example).

### Example: parsing a table from a PDF file

![example cv resume parse convert pdf table to text](https://github.com/adrienjoly/npm-pdfreader-example/raw/master/parseTable.png)

Here is the code required to convert this PDF file into a textual table:

```js
var pdfreader = require("pdfreader");

const nbCols = 2;
const cellPadding = 40; // each cell is padded to fit 40 characters
const columnQuantitizer = (item) => parseFloat(item.x) >= 20;

const padColumns = (array, nb) =>
  Array.apply(null, { length: nb }).map((val, i) => array[i] || []);
// .. because map() skips undefined elements

const mergeCells = (cells) =>
  (cells || [])
    .map((cell) => cell.text)
    .join("") // merge cells
    .substr(0, cellPadding)
    .padEnd(cellPadding, " "); // padding

const renderMatrix = (matrix) =>
  (matrix || [])
    .map((row, y) => padColumns(row, nbCols).map(mergeCells).join(" | "))
    .join("\n");

var table = new pdfreader.TableParser();

new pdfreader.PdfReader().parseFileItems(filename, function (err, item) {
  if (!item || item.page) {
    // end of file, or page
    console.log(renderMatrix(table.getMatrix()));
    console.log("PAGE:", item.page);
    table = new pdfreader.TableParser(); // new/clear table for next page
  } else if (item.text) {
    // accumulate text items into rows object, per line
    table.processItem(item, columnQuantitizer(item));
  }
});
```

Fork this example from [parsing a CV/résumé](https://github.com/adrienjoly/npm-pdfreader-example).

## Example: opening a PDF file with a password

```javascript
new PdfReader({ password: "YOUR_PASSWORD" }).parseFileItems(
  "sample-with-password.pdf",
  function (err, item) {
    if (err) callback(err);
    else if (!item) callback();
    else if (item.text) console.log(item.text);
  }
);
```

## Rule-based data extraction

The Rule class can be used to define and process data extraction rules, while parsing a PDF document.

Rule instances expose "accumulators": methods that defines the data extraction strategy to be used for each rule.

Example:

```javascript
var processItem = Rule.makeItemProcessor([
  Rule.on(/^Hello \"(.*)\"$/)
    .extractRegexpValues()
    .then(displayValue),
  Rule.on(/^Value\:/)
    .parseNextItemValue()
    .then(displayValue),
  Rule.on(/^c1$/).parseTable(3).then(displayTable),
  Rule.on(/^Values\:/)
    .accumulateAfterHeading()
    .then(displayValue),
]);
new PdfReader().parseFileItems("sample.pdf", function (err, item) {
  processItem(item);
});
```

## Troubleshooting & FAQ

### Is it possible to parse a PDF document from a web application?

Solutions exist, but this module cannot be run directly by a web browser. If you really want to use this module, you will have to integrate it into your back-end so that PDF files can be read from your server.

### `Cannot read property 'userAgent' of undefined` error from an express-based node.js app

Dmitry found out that you may need to run these instructions before including the `pdfreader` module:

```js
global.navigator = {
  userAgent: "node",
};

window.navigator = {
  userAgent: "node",
};
```

Source: [express - TypeError: Cannot read property 'userAgent' of undefined error on node.js app run - Stack Overflow](https://stackoverflow.com/questions/49208414/typeerror-cannot-read-property-useragent-of-undefined-error-on-node-js-app-ru)
