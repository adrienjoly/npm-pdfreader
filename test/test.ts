import * as lib from "../types/index.js";
const PdfReader = lib.PdfReader;

const TESTFILE = "./test/sample.pdf";

new PdfReader().parseFileItems(TESTFILE, (err, item) => {
  if (err) console.error("error:", err);
  else if (!item) console.warn("end of file");
  else if (item.text) console.log(item.text);
});
