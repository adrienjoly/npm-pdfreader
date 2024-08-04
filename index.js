import * as parseTableExports from "./lib/parseTable.js";
import * as parseColumnsExports from "./lib/parseColumns.js";

export { PdfReader } from "./PdfReader.js";
export { Rule } from "./Rule.js";
export * as LOG from "./lib/LOG.js";
export const parseTable = Object.assign(
  parseTableExports.parseTable,
  parseTableExports
);

export const parseColumns = Object.assign(
  parseColumnsExports.parseColumns,
  parseColumnsExports
);
export { SequentialParser } from "./lib/SequentialParser.js"; // experimental
export { TableParser } from "./lib/TableParser.js";
export { ColumnsParser } from "./lib/ColumnsParser.js";
