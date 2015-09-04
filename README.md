# pdfreader
NPM module for simplifying the development of scripted / rule-based parsing of PDF files, including tabular data (tables, with automatic column detection).

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
