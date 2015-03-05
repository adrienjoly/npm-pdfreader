var LOG = require("../lib/LOG.js").toggle(false);
var lib = require("../");
var PdfReader = lib.PdfReader;
var Rule = lib.Rule;

var TESTFILE = "./test/sample.pdf";

// step 1: print raw items

function printRawItems(callback){
  new PdfReader().parseFileItems(TESTFILE, function(err, item){
    if (err)
      callback(err);
    else if (!item)
      callback();
    else
      console.log(item);
  });
}

// step 2

function parseData(callback){
  function displayValue(value){
    console.log("extracted value:", value);
  }
  function displayTable(table){
    for (var i=0; i<table.length; ++i)
      console.log(table[i].join("\t"));
  }
  var rules = [
    Rule.on(/^Hello \"(.*)\"$/).extractRegexpValues().then(displayValue),
    Rule.on(/^Value\:/).parseNextItemValue().then(displayValue),
    Rule.on(/^c1$/).parseTable(3).then(displayTable),
    Rule.on(/^Values\:/).accumulateAfterHeading().then(displayValue),
  ];
  var processItem = Rule.makeItemProcessor(rules);
  new PdfReader().parseFileItems(TESTFILE, function(err, item){
    if (err)
      callback(err);
    else {
      processItem(item);
      if (!item)
        callback(err, item);
    }
  });
}

// run tests

console.log("\ntest 1: raw items from sample.pdf\n");
printRawItems(function(){
  console.log("\ntest 2: parse values from sample.pdf\n");
  parseData(function(){
    console.log("\ndone.\n");
  });  
});
