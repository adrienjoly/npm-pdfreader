var LOG = require("./lib/LOG.js").toggle(false);
var PdfReader = require("./index.js").PdfReader;
var fs = require("fs");

function printRawItems(pdfBuffer, callback) {
  new PdfReader().parseBuffer(pdfBuffer, function (err, item) {
    if (err) callback(err);
    else if (!item) callback();
    else if (item.file) console.log("file =", item.file.path);
    else if (item.page) console.log("page =", item.page);
    else if (item.x)
      console.log(
        [item.x, item.y, item.oc, item.A, Math.floor(item.w), item.text].join(
          "\t"
        )
      );
    else console.warn(item);
  });
}

var filename = process.argv[2];
if (!filename) {
  console.error("please provide the name of a PDF file");
} else {
  console.warn("printing raw items from file:", filename, "...");
  fs.readFile(filename, (err, pdfBuffer) => {
    if (err) console.error(err);
    printRawItems(pdfBuffer, function () {
      console.warn("done.");
    });
  });
}
