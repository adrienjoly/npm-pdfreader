import { Transform, Readable, TransformOptions } from "stream";
import { EventEmitter } from "events";
import * as fs from "fs";

declare module "pdf2json/lib/pdf.js" {
  class PDFJSClass extends EventEmitter {
    constructor(needRawText: boolean);

    raiseErrorEvent(errMsg: string): string;
    raiseReadyEvent(data: any): any;
    parsePDFData(arrayBuffer: ArrayBuffer, password: string): void;
    tryLoadFieldInfoXML(pdfFilePath: string): void;
    load(pdfDocument: any, scale: number): Promise<void>;
    loadMetaData(): Promise<void>;
    parseMetaData(): void;
    loadPages(): Promise<void>;
    parsePage(promisedPages: any[], id: number, scale: number): void;
    getRawTextContent(): string;
    getAllFieldsTypes(): any;
    getMergedTextBlocksIfNeeded(): any;
    destroy(): void;
  }

  export = PDFJSClass;
}

declare class ParserStream extends Transform {
  static createContentStream(jsonObj: any): Readable;
  static createOutputStream(
    outputPath: string,
    resolve: () => void,
    reject: (err: Error) => void
  ): fs.WriteStream;

  constructor(pdfParser: any, options?: TransformOptions);
}

declare module "parserstream.js" {
  export = ParserStream;

  export class StringifyStream extends Transform {
    constructor(options?: TransformOptions);
  }
}

declare module "/pdf2json/lib/pdfconst.js" {
  export const kColors: string[];
  export const kFontFaces: string[];
  export const kFontStyles: [number, number, number, number][];
}

declare class PDFParser extends EventEmitter {
  static colorDict: any;
  static fontFaceDict: any;
  static fontStyleDict: any;

  constructor(context: any, needRawText: boolean, password: string);

  createParserStream(): ParserStream; // Define the type of ParserStream if needed.
  loadPDF(pdfFilePath: string, verbosity: number): Promise<void>;
  parseBuffer(pdfBuffer: Buffer): void;
  getRawTextContent(): string;
  getRawTextContentStream(): any; // Define the type of the stream if needed.
  getAllFieldsTypes(): any; // Define the type of the result.
  getAllFieldsTypesStream(): any; // Define the type of the stream if needed.
  getMergedTextBlocksIfNeeded(): any; // Define the type of the result.
  getMergedTextBlocksStream(): any; // Define the type of the stream if needed.
  destroy(): void;
}

declare module "LOG.js" {
  // No need to re-export here, just reference the functions
  // Exporting and re-exporting is not necessary
}

declare class PdfReader {
  constructor(options?: PdfReaderOptions);
  parseFileItems(pdfFilePath: string, itemHandler: ItemHandler): void;
  parseBuffer(pdfBuffer: Buffer, itemHandler: ItemHandler): void;
}

interface PdfReaderOptions {
  password?: string;
  debug?: boolean;
}

interface Item {
  file?: { path: string; buffer?: Buffer };
  page?: number;
  width?: number;
  height?: number;
  text?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

type ItemHandler = (error: Error | null, item?: Item) => void;
