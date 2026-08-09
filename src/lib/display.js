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
