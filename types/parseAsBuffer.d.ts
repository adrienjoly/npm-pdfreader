import { ItemHandler, PdfReaderOptions } from "./PdfReader";

declare module "LOG.js" {
  export function toggle(enabled: boolean): void;
}

declare module "./index.js" {
  // Update this path based on your actual index.js path

  export class PdfReader {
    constructor(options?: PdfReaderOptions);
    parseBuffer(pdfBuffer: Buffer, itemHandler: ItemHandler): void;
    // Add any other methods or types related to PdfReader here
  }
}

declare function printRawItems(
  pdfBuffer: Buffer,
  callback: (err?: Error) => void
): void;

declare module "parseAsBuffer.js" {
  // No need to re-export printRawItems here
}
