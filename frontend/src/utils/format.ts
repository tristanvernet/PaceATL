/** Rounds to `digits` places and drops trailing zeros, so 2.50 reads "2.5" and 3.0 reads "3". */
export const formatNumber = (n: number, digits = 1) => String(Number(n.toFixed(digits)));
