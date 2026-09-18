/** Shop configuration that both the server and the browser need.
 *  Deliberately free of any database import so client components can
 *  use it. */

export const currency = { code: "BDT", symbol: "৳" };

/** The shop ships within Bangladesh only, so this is not a question any
 *  form needs to ask. Addresses still carry it, because an order should
 *  record where it went rather than assume it forever. */
export const COUNTRY = "Bangladesh";

/** Formats an amount given in minor units (cents). */
export const formatPrice = (minorUnits: number) =>
  `${currency.symbol}${(minorUnits / 100).toFixed(2)}`;

export const FREE_SHIPPING_THRESHOLD = 15000;
