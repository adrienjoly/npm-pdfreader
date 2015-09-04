var LOG = require("./lib/LOG.js").toggle(false);
var PdfReader = require("./index.js").PdfReader;

function printRawItems(filename, callback){
  new PdfReader().parseFileItems(filename, function(err, item){
    if (err)
      callback(err);
    else if (!item)
      callback();
    else
      console.log(item);
  });
}

var filename = process.argv[2];
if (!filename) {
  console.error("please provide the name of a PDF file");
}
else {
  console.warn("printing raw items from file:", filename);
  printRawItems(filename, function(){
    console.warn("done.");
  });
}
