declare module "./lib/LOG" {
  export function log(...args: any[]): void;
}

declare module "./lib/parseColumns" {
  // Declare types from parseColumns.js here if needed
}

declare module "./lib/parseTable" {
  // Declare types from parseTable.js here if needed
}

declare namespace RuleNamespace {
  interface RuleConstructor {
    new (regexp: RegExp): RuleInstance;
    on(regexp: RegExp): RuleInstance;
    after(regexp: RegExp): RuleInstance;
    accumulators: {
      [accumulatorName: string]: (...args: any[]) => RuleAccumulator;
      // Add more accumulator declarations here
    };
    addAccumulator(
      methodName: string,
      methodBuilder: (...args: any[]) => RuleAccumulator
    ): void;
  }

  interface RuleInstance {
    regexp: RegExp;
    methodName?: string;
    accumulatorParams?: any[];
    accumulatorBuilder?: (...args: any[]) => RuleAccumulator;
    terminate?: () => void;
    currentItem?: any; // Define the type of currentItem if needed
    accumulatorImpl?: RuleAccumulator;
    skipCurrentItem?: boolean;
    output?: any; // Define the type of output if needed
    then(fct: (output: any) => void): RuleInstance;
    test(item: any): RuleAccumulator | undefined;
    whenDone(fct: () => void): void;
  }

  type RuleAccumulator = (item: any) => boolean | void;
}

declare const Rule: RuleNamespace.RuleConstructor;

export = Rule;
