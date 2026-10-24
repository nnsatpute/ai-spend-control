import { Decimal } from "@prisma/client/runtime/library";

/**
 * Money helpers. Provider spend arrives as fractional cents;
 * all math uses Decimal — never native float math.
 */

export type DecimalInput = Decimal | string | number;

export function toDecimal(value: DecimalInput): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

export function sumDecimals(values: DecimalInput[]): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(toDecimal(v)), new Decimal(0));
}

export function dollarsToCents(dollars: DecimalInput): Decimal {
  return toDecimal(dollars).times(100);
}

/** "$1,234.56" from cents, rounded half-up to whole cents. */
export function formatUsdFromCents(cents: DecimalInput): string {
  const dollars = toDecimal(cents)
    .dividedBy(100)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const negative = dollars.isNegative();
  const [whole = "0", fraction = "00"] = dollars.abs().toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}$${grouped}.${fraction}`;
}
