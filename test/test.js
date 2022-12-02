import assert from "assert";
import test from "ava";
import { toggle } from "../lib/LOG.js";
import * as lib from "../index.js";

toggle(false);

const PdfReader = lib.PdfReader;
const Rule = lib.Rule;

const TESTFILE = "./test/sample.pdf";
const TESTFILE_WITH_PASSWORD = "./test/sample-with-password.pdf";

test("parse raw items from pdf file", async (t) => {
  const res = new Promise((resolve, reject) => {
    const items = [];
    new PdfReader().parseFileItems(TESTFILE, (err, item) => {
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
        .then((value) => content.push({ accumulateAfterHeading: value })),
    ];
    const processItem = Rule.makeItemProcessor(rules);
    new PdfReader().parseFileItems(TESTFILE, (err, item) => {
      if (err) reject(err);
      else {
        processItem(item);
        if (!item) resolve(content);
      }
    });
  });
  t.snapshot(await res);
});

test("parse Table from PDF file, using TableParser", async (t) => {
  const matrix = await new Promise((resolve, reject) => {
    // the thresholds were determined manually, based on the horizontal position (x) for column headers
    const colThresholds = [6.8, 9.5, 13.3, 16.7, 18.4, 28, 32, 36, Infinity];

    const columnQuantitizer = (item) => {
      const col = colThresholds.findIndex(
        (colThreshold) => parseFloat(item.x) < colThreshold
      );
      assert(col >= 0, col);
      assert(col < colThresholds.length, col);
      // console.log(`COL ${col}\t${parseFloat(item.x)}\t${item.text}`);
      return col;
    };

    const table = new lib.TableParser();
    new PdfReader().parseFileItems("./test/sample-table.pdf", (err, item) => {
      if (err) reject(err);
      else if (!item) {
        resolve(table.getCleanMatrix({ collisionSeparator: "" }));
      } else if (item.text) {
        table.processItem(item, columnQuantitizer(item));
      }
    });
  });
  // console.table(matrix);
  t.snapshot(matrix);
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
    shell: true, // needed in order to run npm commands with execa
  });
  t.snapshot({ stdout, stderr });
});
