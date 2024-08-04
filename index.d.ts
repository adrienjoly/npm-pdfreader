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
  constructor(opts?: InitOptions | null);
  parseFileItems(pdfFilePath: string, itemHandler: ItemHandler): void;
  parseBuffer(buffer: Buffer, itemHandler: ItemHandler): void;
}

export type Item = {
  x: number;
  y: number;
  sw: number;
  w: number;
  A: string;
  clr: number;
  R: {
    T: string;
    S: number;
    TS: any[];
  }[];
  text: string;
};

export class TableParser {
  private rows: { [key: string]: Item[] };
  constructor();
  processItem(item: Item, col: number): void;
  processHeadingItem(item: Item, col: number): void;
  getRows(): Item[][];
  renderRows(): string;
  /** row-> column-> items_collisionning_in_column-> item:Item */
  getMatrix(): Item[][][];
  getCleanMatrix(options?: { collisionSeparator: string }): string[][];
  renderMatrix(): string;
}
