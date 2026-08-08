// Small, dependency-free unit conversion and formatting helpers.
// Kept separate from calc.js so recipe math stays free of display concerns.

export const OZ_PER_GALLON = 128
export const OZ_PER_CUP = 8
export const OZ_PER_TBSP = 0.5
export const TSP_PER_TBSP = 3
export const OZ_PER_TSP = OZ_PER_TBSP / TSP_PER_TBSP
export const ML_PER_OZ = 29.5735
export const OZ_PER_HALF_GALLON = 64
export const ML_PER_BOTTLE = 750

export function ceilToIncrement(value, increment) {
  if (increment <= 0) throw new Error('increment must be positive')
  return Math.ceil(value / increment - 1e-9) * increment
}

export function roundToIncrement(value, increment) {
  if (increment <= 0) throw new Error('increment must be positive')
  return Math.round(value / increment) * increment
}

// Formats a quantity as a mixed number (e.g. 1.75 -> "1 3/4") reduced against
// the given denominator. Assumes the value is already a multiple (or very
// close to one) of 1/denominator, which is guaranteed for values produced by
// roundToIncrement(value, 1/denominator).
export function formatMixedNumber(value, denominator = 1) {
  if (value === 0) return '0'
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  const whole = Math.floor(abs + 1e-9)
  let numerator = Math.round((abs - whole) * denominator)
  let denom = denominator

  if (numerator === 0) return `${sign}${whole}`

  const divisor = gcd(numerator, denom)
  numerator /= divisor
  denom /= divisor

  const fraction = `${numerator}/${denom}`
  return whole === 0 ? `${sign}${fraction}` : `${sign}${whole} ${fraction}`
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b)
}

export function ozToGallons(oz) {
  return oz / OZ_PER_GALLON
}

export function gallonsToOz(gallons) {
  return gallons * OZ_PER_GALLON
}

export function tbspToCups(tbsp) {
  return tbsp / 16
}

export function ozToMl(oz) {
  return oz * ML_PER_OZ
}
