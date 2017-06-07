[![CircleCI](https://circleci.com/gh/adrienjoly/npm-pdfreader.svg?style=svg)](https://circleci.com/gh/adrienjoly/npm-pdfreader)

# pdfreader

Read text and parse tables from PDF files.

Supports tabular data with automatic column detection, and rule-based parsing.

This module is meant to be run using Node.js only. **It does not work from a web browser.**

## Installation, tests and CLI usage

    npm install pdfreader
    cd node_modules/pdfreader
    npm test
    node parse.js test/sample.pdf

## Raw PDF reading

The PdfReader class reads a PDF file, and calls a function on each item found while parsing that file.

 An item object can match one of the following objects:

 - `null`, when the parsing is over, or an error occured.
 - `{file:{path:string}}`, when a PDF file is being opened.
 - `{page:integer}`, when a new page is being parsed, provides the page number, starting at 1.
 - `{text:string, x:float, y:float, w:float, h:float...}`, represents each text with its position.

Example:

```javascript
new PdfReader().parseFileItems("sample.pdf", function(err, item){
  if (err)
    callback(err);
  else if (!item)
    callback();
  else if (item.text)
    console.log(item.text);
});
```

## Raw PDF reading from a PDF already in memory (buffer)

The PdfReader class reads a PDF file, and calls a function on each item found while parsing that file.

 An item object can match one of the following objects:

 - `null`, when the parsing is over, or an error occured.
 - `{file:{path:string}}`, when a PDF file is being opened.
 - `{page:integer}`, when a new page is being parsed, provides the page number, starting at 1.
 - `{text:string, x:float, y:float, w:float, h:float...}`, represents each text with its position.

Example:

```javascript
var fs = require("fs");
fs.readFile("sample.pdf", (err, pdfBuffer) => {
  // pdfBuffer contains the file content
  new PdfReader().parseBuffer(pdfBuffer, function(err, item){
    if (err)
      callback(err);
    else if (!item)
      callback();
    else if (item.text)
      console.log(item.text);
  });
});
```

## Example: parsing lines of text from a PDF file

![example cv resume parse convert pdf to text](https://github.com/adrienjoly/npm-pdfreader-example/raw/master/parseRows.png)

Here is the code required to convert this PDF file into text:

```js
var pdfreader = require('pdfreader');

var rows = {}; // indexed by y-position

function printRows() {
  Object.keys(rows) // => array of y-positions (type: float)
    .sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
    .forEach((y) => console.log((rows[y] || []).join('')));
}

new pdfreader.PdfReader().parseFileItems('CV_ErhanYasar.pdf', function(err, item){
  if (!item || item.page) {
    // end of file, or page
    printRows();
    console.log('PAGE:', item.page);
    rows = {}; // clear rows for next page
  }
  else if (item.text) {
    // accumulate text items into rows object, per line
    (rows[item.y] = rows[item.y] || []).push(item.text);
  }
});
```

Fork this example from [parsing a CV/résumé](https://github.com/adrienjoly/npm-pdfreader-example).

## Example: parsing a table from a PDF file

![example cv resume parse convert pdf table to text](https://github.com/adrienjoly/npm-pdfreader-example/raw/master/parseTable.png)

Here is the code required to convert this PDF file into a textual table:

```js
var pdfreader = require('pdfreader');

const nbCols = 2;
const cellPadding = 40; // each cell is padded to fit 40 characters
const columnQuantitizer = (item) => parseFloat(item.x) >= 20;

const padColumns = (array, nb) =>
  Array.apply(null, {length: nb}).map((val, i) => array[i] || []);
  // .. because map() skips undefined elements

const mergeCells = (cells) => (cells || [])
  .map((cell) => cell.text).join('') // merge cells
  .substr(0, cellPadding).padEnd(cellPadding, ' '); // padding

const renderMatrix = (matrix) => (matrix || [])
  .map((row, y) => padColumns(row, nbCols)
    .map(mergeCells)
    .join(' | ')
  ).join('\n');

var table = new pdfreader.TableParser();

new pdfreader.PdfReader().parseFileItems(filename, function(err, item){
  if (!item || item.page) {
    // end of file, or page
    console.log(renderMatrix(table.getMatrix()));
    console.log('PAGE:', item.page);
    table = new pdfreader.TableParser(); // new/clear table for next page
  } else if (item.text) {
    // accumulate text items into rows object, per line
    table.processItem(item, columnQuantitizer(item));
  }
});
```

Fork this example from [parsing a CV/résumé](https://github.com/adrienjoly/npm-pdfreader-example).


## Rule-based data extraction

The Rule class can be used to define and process data extraction rules, while parsing a PDF document.

Rule instances expose "accumulators": methods that defines the data extraction strategy to be used for each rule.

Example:

```javascript
var processItem = Rule.makeItemProcessor([
  Rule.on(/^Hello \"(.*)\"$/).extractRegexpValues().then(displayValue),
  Rule.on(/^Value\:/).parseNextItemValue().then(displayValue),
  Rule.on(/^c1$/).parseTable(3).then(displayTable),
  Rule.on(/^Values\:/).accumulateAfterHeading().then(displayValue),
]);
new PdfReader().parseFileItems("sample.pdf", function(err, item){
  processItem(item);
});
```
