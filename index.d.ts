export type InitOptions = { password?: string; debug?: boolean };
export type Error = null | string;

export type DataEntry = {
  page?: number;
  width?: number;
  height?: number;
  text?: string;
  file?: {
    path?: string;
    buffer?: string;
  };
} | null;

export type ItemHandler = (err: Error, data: DataEntry) => void;

export declare class PdfReader {
  constructor(opts: InitOptions | null);
  parseFileItems(pdfFilePath: string, itemHandler: ItemHandler): void;
  parseBuffer(buffer: Buffer, itemHandler: ItemHandler): void;
}
