/** Shop configuration that both the server and the browser need.
 *  Deliberately free of any database import so client components can
 *  use it. */

export const currency = { code: "BDT", symbol: "৳" };

/** Formats an amount given in minor units (cents). */
export const formatPrice = (minorUnits: number) =>
  `${currency.symbol}${(minorUnits / 100).toFixed(2)}`;

export const FREE_SHIPPING_THRESHOLD = 15000;
