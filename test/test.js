const test = require("ava");
const LOG = require("../lib/LOG.js").toggle(false);
const lib = require("../");
const PdfReader = lib.PdfReader;
const Rule = lib.Rule;

const TESTFILE = "./test/sample.pdf";
const TESTFILE_WITH_PASSWORD = "./test/sample-with-password.pdf";

test("parse raw items from pdf file", async (t) => {
  const res = new Promise((resolve, reject) => {
    const items = [];
    new PdfReader().parseFileItems(TESTFILE, function (err, item) {
      if (err) reject(err);
      else if (!item) resolve(items);
      else items.push(item);
    });
  });
  t.snapshot(await res);
});

test("parse structured content from pdf file, using rules", async (t) => {
  const res = new Promise((resolve, reject) => {
    const content = [];
    const rules = [
      Rule.on(/^Hello \"(.*)\"$/)
        .extractRegexpValues()
        .then((value) => content.push({ extractRegexpValues: value })),
      Rule.on(/^Value\:/)
        .parseNextItemValue()
        .then((value) => content.push({ parseNextItemValue: value })),
      Rule.on(/^c1$/)
        .parseTable(3)
        .then((table) =>
          content.push({
            "parseTable.renderMatrix": lib.parseTable.renderMatrix(
              table.matrix
            ),
            "parseTable.renderItems": lib.parseTable.renderItems(table.items),
          })
        ),
      Rule.on(/^Values\:/)
        .accumulateAfterHeading()
        .then((value) => content.push({ accumulateAfterHeading: value })), // TODO: fix test so that these values are also returned
    ];
    const processItem = Rule.makeItemProcessor(rules);
    new PdfReader().parseFileItems(TESTFILE, function (err, item) {
      if (err) reject(err);
      else if (!item) resolve(content);
      else processItem(item);
    });
  });
  t.snapshot(await res);
});

test("support pdf file with password", async (t) => {
  const promise = new Promise((resolve, reject) =>
    new PdfReader({ password: "password" }).parseFileItems(
      TESTFILE_WITH_PASSWORD,
      (err, item) => {
        if (err) reject(err);
        else if (!item) resolve();
      }
    )
  );
  await t.notThrowsAsync(promise);
});

test("sample scripts should print raw items from pdf file", async (t) => {
  const { execa } = await import("execa");
  const { stdout, stderr } = await execa("npm run test:samples", {
    shell: true, // needed in order to run npm commands
  });
  t.snapshot({ stdout, stderr });
});
