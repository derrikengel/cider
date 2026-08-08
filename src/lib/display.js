// Formatting for on-screen display. Kept separate from calc.js so the pure
// math never has to think about strings, pluralization, or rounding for
// human eyes vs. rounding for the recipe itself.

import { formatMixedNumber, roundToIncrement, tbspToCups, ozToGallons } from './units.js'

export function formatIngredientAmount(ingredient, amount, { asCups = false } = {}) {
  if (amount <= 0) return `0 ${ingredient.label.toLowerCase()}`

  if (ingredient.kind === 'count') {
    return `${Math.round(amount)} ${ingredient.label}`
  }

  if (ingredient.kind === 'tsp') {
    const rounded = roundToIncrement(amount, 1 / 8)
    return `${formatMixedNumber(rounded, 8)} tsp ${ingredient.label}`
  }

  if (ingredient.kind === 'tbsp') {
    if (asCups) {
      const cups = tbspToCups(amount)
      const rounded = roundToIncrement(cups, 1 / 8)
      const unit = rounded > 1 ? 'cups' : 'cup'
      return `${formatMixedNumber(rounded, 8)} ${unit} ${ingredient.label}`
    }
    const rounded = roundToIncrement(amount, 1 / 4)
    return `${formatMixedNumber(rounded, 4)} tbsp ${ingredient.label}`
  }

  throw new Error(`Unknown ingredient kind: ${ingredient.kind}`)
}

export function formatOz(oz, { precision = 0 } = {}) {
  return `${oz.toFixed(precision)} oz`
}

export function formatGallons(gallons, { precision = 2 } = {}) {
  return `${gallons.toFixed(precision)} gal`
}

export function formatOzWithGallons(oz) {
  return `${formatOz(oz)} (≈${formatGallons(ozToGallons(oz))})`
}

export function formatServings(count) {
  const rounded = Math.round(count * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1)
}
