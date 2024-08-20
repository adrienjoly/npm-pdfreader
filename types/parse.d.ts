declare module "parse.js" {
  export function printRawItems(
    filename: string,
    callback: (err?: Error) => void
  ): void;
}
