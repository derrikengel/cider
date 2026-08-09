// Formatting for on-screen display. Kept separate from calc.js so the pure
// math never has to think about strings, pluralization, or rounding for
// human eyes vs. rounding for the recipe itself.

import { formatMixedNumber, roundToIncrement, tbspToCups, ozToGallons } from './units.js'

// Splits an ingredient line into its quantity (number + unit) and label, so
// callers can style them differently (e.g. a bold quantity for scanning).
export function formatIngredientAmountParts(ingredient, amount, { asCups = false } = {}) {
    if (amount <= 0) return { quantity: '0', label: ingredient.label.toLowerCase() }

    if (ingredient.kind === 'count') {
        return { quantity: `${Math.round(amount)}`, label: ingredient.label }
    }

    if (ingredient.kind === 'tsp') {
        const rounded = roundToIncrement(amount, 1 / 8)
        return { quantity: `${formatMixedNumber(rounded, 8)} tsp`, label: ingredient.label }
    }

    if (ingredient.kind === 'tbsp') {
        if (asCups) {
            const cups = tbspToCups(amount)
            const rounded = roundToIncrement(cups, 1 / 8)
            const unit = rounded > 1 ? 'cups' : 'cup'
            return { quantity: `${formatMixedNumber(rounded, 8)} ${unit}`, label: ingredient.label }
        }
        const rounded = roundToIncrement(amount, 1 / 4)
        return { quantity: `${formatMixedNumber(rounded, 4)} tbsp`, label: ingredient.label }
    }

    throw new Error(`Unknown ingredient kind: ${ingredient.kind}`)
}

export function formatIngredientAmount(ingredient, amount, options = {}) {
    const { quantity, label } = formatIngredientAmountParts(ingredient, amount, options)
    return `${quantity}`
}

// Rounds to `precision` decimals then drops trailing zeros (9.50 -> "9.5",
// 4.00 -> "4"), so whole and fractional amounts share one code path instead
// of each caller having to branch on "is this a whole number?".
function trimmedFixed(value, precision) {
    return Number(value.toFixed(precision)).toString()
}

export function formatOz(oz, { precision = 0 } = {}) {
    return `${trimmedFixed(oz, precision)} oz`
}

export function formatGallons(gallons, { precision = 2 } = {}) {
    return `${trimmedFixed(gallons, precision)} gal`
}

export function formatMl(ml, { precision = 0 } = {}) {
    return `${trimmedFixed(ml, precision)} ml`
}

export function formatCups(cups, { precision = 2 } = {}) {
    return `${trimmedFixed(cups, precision)} cups`
}

export function formatOzWithGallons(oz) {
    return `${formatOz(oz)} (≈${formatGallons(ozToGallons(oz))})`
}

export function formatServings(count) {
    return trimmedFixed(count, 1)
}
