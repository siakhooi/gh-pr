import { InvalidOptionArgumentError } from 'commander';

function assertIsANumber(parsedValue: number) {
  if (Number.isNaN(parsedValue)) throw new InvalidOptionArgumentError('Not a number');
}
function assertIsPositiveNumber(parsedValue: number) {
  if (parsedValue < 1) throw new InvalidOptionArgumentError('Must be a positive number');
}

export function parsePositiveNumber(value: string): number {
  const parsedValue = Number.parseInt(value, 10);
  assertIsANumber(parsedValue);
  assertIsPositiveNumber(parsedValue);
  return parsedValue;
}
export function collectLabels(value: string, collection: string[]): string[] {
  return collection.concat([value]);
}
