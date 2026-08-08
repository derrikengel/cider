import { describe, it, expect } from 'vitest'
import {
  servingsPerGallon,
  ciderGallonsForServings,
  servingsForCiderGallons,
  resolveCiderGallons,
  computeTotals,
  ciderShopping,
  bourbonShopping,
  ingredientShoppingList,
  planBatches,
  scaleIngredient,
  roundIngredientAmount,
} from './calc.js'
import { INGREDIENTS, DEFAULT_BOURBON_CUPS_PER_GALLON, WRITTEN_BOURBON_CUPS_PER_GALLON } from './baseRecipe.js'
import { formatMixedNumber, roundToIncrement, ceilToIncrement } from './units.js'

describe('servingsPerGallon', () => {
  it('matches the Halloween default: 1.5 cups/gal, 8oz servings -> 17.5', () => {
    expect(servingsPerGallon(1.5, 8)).toBeCloseTo(17.5)
  })

  it('matches the written-recipe strength: 2 cups/gal, 8oz servings -> 18', () => {
    expect(servingsPerGallon(2, 8)).toBeCloseTo(18)
  })

  it('scales down with bigger servings', () => {
    expect(servingsPerGallon(1.5, 16)).toBeCloseTo(8.75)
  })
})

describe('brief worked example (11 gallons cider, 1.5 cups/gal, 8oz servings)', () => {
  it('192.5 servings requires 11 gallons of cider', () => {
    expect(ciderGallonsForServings(192.5, 1.5, 8)).toBeCloseTo(11)
  })

  it('11 gallons of cider yields 192.5 servings', () => {
    expect(servingsForCiderGallons(11, 1.5, 8)).toBeCloseTo(192.5)
  })

  it('totals: 1408oz cider + 132oz bourbon = 1540oz mixture', () => {
    const totals = computeTotals({ ciderGallons: 11, bourbonCupsPerGallon: 1.5, servingOz: 8 })
    expect(totals.totalCiderOz).toBeCloseTo(1408)
    expect(totals.totalBourbonCups).toBeCloseTo(16.5)
    expect(totals.totalBourbonOz).toBeCloseTo(132)
    expect(totals.totalMixtureOz).toBeCloseTo(1540)
    expect(totals.estimatedServings).toBeCloseTo(192.5)
  })

  it('bourbon shopping needs 6 bottles of 750ml', () => {
    const shopping = bourbonShopping(16.5)
    expect(shopping.buyBottles).toBe(6)
  })

  it('cider shopping needs exactly 11 gallons (already a half-gallon multiple)', () => {
    const shopping = ciderShopping(11)
    expect(shopping.buyGallons).toBeCloseTo(11)
  })
})

describe('resolveCiderGallons', () => {
  it('resolves from servings target', () => {
    const gallons = resolveCiderGallons({
      planningMode: 'servings',
      servingsTarget: 192.5,
      bourbonCupsPerGallon: 1.5,
      servingOz: 8,
    })
    expect(gallons).toBeCloseTo(11)
  })

  it('resolves from a fixed cider amount directly', () => {
    const gallons = resolveCiderGallons({
      planningMode: 'cider',
      ciderGallons: 7,
      bourbonCupsPerGallon: 1.5,
      servingOz: 8,
    })
    expect(gallons).toBe(7)
  })
})

describe('ciderShopping (use vs. buy)', () => {
  it('94oz to use rounds up to a full gallon to buy', () => {
    const shopping = ciderShopping(94 / 128)
    expect(shopping.useOz).toBeCloseTo(94)
    expect(shopping.buyOz).toBeCloseTo(128)
    expect(shopping.buyGallons).toBeCloseTo(1)
  })

  it('an exact half-gallon multiple buys exactly that amount', () => {
    const shopping = ciderShopping(1.5)
    expect(shopping.buyGallons).toBeCloseTo(1.5)
  })
})

describe('bourbonShopping', () => {
  it('rounds up to whole bottles, never down', () => {
    // just over 5 bottles worth
    const justOverFive = (5 * 750 + 1) / 29.5735 / 8
    expect(bourbonShopping(justOverFive).buyBottles).toBe(6)
  })

  it('an exact bottle multiple does not round up further', () => {
    const exactlyTwoBottles = (2 * 750) / 29.5735 / 8
    expect(bourbonShopping(exactlyTwoBottles).buyBottles).toBe(2)
  })
})

describe('overrides', () => {
  it('falls back to the base amount when no override is set', () => {
    const cloves = INGREDIENTS.find((i) => i.key === 'cloves')
    expect(scaleIngredient(cloves, {}, 0.5)).toBe(12)
  })

  it('uses the override amount (in the same per-half-gallon terms) when set', () => {
    const cloves = INGREDIENTS.find((i) => i.key === 'cloves')
    expect(scaleIngredient(cloves, { cloves: 6 }, 0.5)).toBe(6)
    expect(scaleIngredient(cloves, { cloves: 6 }, 1)).toBe(12)
  })

  it('marks an ingredient overridden in the shopping list when set', () => {
    const list = ingredientShoppingList(1, { cloves: 6 })
    const cloves = list.find((i) => i.key === 'cloves')
    expect(cloves.isOverridden).toBe(true)
    expect(cloves.amount).toBe(12)

    const orange = list.find((i) => i.key === 'orange')
    expect(orange.isOverridden).toBe(false)
  })
})

describe('roundIngredientAmount', () => {
  it('rounds whole-count ingredients to the nearest whole, minimum 1 if any is needed', () => {
    const cloves = INGREDIENTS.find((i) => i.key === 'cloves')
    expect(roundIngredientAmount(cloves, 2.4)).toBe(2)
    expect(roundIngredientAmount(cloves, 0.3)).toBe(1)
    expect(roundIngredientAmount(cloves, 0)).toBe(0)
  })

  it('rounds tsp ingredients to the nearest 1/8 tsp', () => {
    const nutmeg = INGREDIENTS.find((i) => i.key === 'nutmeg')
    expect(roundIngredientAmount(nutmeg, 0.1)).toBeCloseTo(0.125)
  })

  it('rounds tbsp ingredients to the nearest 1/4 tbsp', () => {
    const sugar = INGREDIENTS.find((i) => i.key === 'brownSugar')
    expect(roundIngredientAmount(sugar, 0.85)).toBeCloseTo(0.75)
  })
})

describe('planBatches', () => {
  it('splits evenly when the total is a whole number of batches', () => {
    const batches = planBatches({
      ciderGallons: 3,
      batchSizeGal: 1,
      bourbonCupsPerGallon: 1.5,
      overrides: {},
    })
    expect(batches).toHaveLength(1)
    expect(batches[0].count).toBe(3)
    expect(batches[0].sizeGal).toBe(1)
  })

  it('produces full batches plus a smaller remainder batch', () => {
    const batches = planBatches({
      ciderGallons: 3.5,
      batchSizeGal: 1.5,
      bourbonCupsPerGallon: 1.5,
      overrides: {},
    })
    expect(batches).toHaveLength(2)
    expect(batches[0]).toMatchObject({ sizeGal: 1.5, count: 2 })
    expect(batches[1].sizeGal).toBeCloseTo(0.5)
    expect(batches[1].count).toBe(1)
  })

  it('every full batch has identical, whole-number ingredient amounts', () => {
    const batches = planBatches({
      ciderGallons: 2,
      batchSizeGal: 1,
      bourbonCupsPerGallon: 1.5,
      overrides: {},
    })
    const cloves = batches[0].ingredients.find((i) => i.key === 'cloves')
    // 1 gallon = double the half-gallon base -> 24 cloves per batch
    expect(cloves.amount).toBe(24)
  })

  it('scales bourbon per batch, not just at the total level', () => {
    const batches = planBatches({
      ciderGallons: 2,
      batchSizeGal: 1,
      bourbonCupsPerGallon: 1.5,
      overrides: {},
    })
    expect(batches[0].bourbonCups).toBeCloseTo(1.5)
  })

  it('does not emit a remainder batch for a negligible leftover', () => {
    const batches = planBatches({
      ciderGallons: 2.0000001,
      batchSizeGal: 1,
      bourbonCupsPerGallon: 1.5,
      overrides: {},
    })
    expect(batches).toHaveLength(1)
    expect(batches[0].count).toBe(2)
  })
})

describe('formatMixedNumber', () => {
  it('formats whole numbers', () => {
    expect(formatMixedNumber(2, 8)).toBe('2')
  })

  it('formats pure fractions', () => {
    expect(formatMixedNumber(0.75, 4)).toBe('3/4')
  })

  it('formats and reduces mixed numbers', () => {
    expect(formatMixedNumber(1.5, 8)).toBe('1 1/2')
  })

  it('formats eighths without reducing when already lowest terms', () => {
    expect(formatMixedNumber(0.125, 8)).toBe('1/8')
  })
})

describe('units', () => {
  it('roundToIncrement rounds to the nearest step', () => {
    expect(roundToIncrement(0.83, 0.25)).toBeCloseTo(0.75)
  })

  it('ceilToIncrement rounds up, and does not bump an exact multiple', () => {
    expect(ceilToIncrement(64, 64)).toBeCloseTo(64)
    expect(ceilToIncrement(64.01, 64)).toBeCloseTo(128)
  })
})

describe('bourbon ratio defaults from the brief', () => {
  it('Halloween default is ~10:1 (1.5 cups/gal)', () => {
    expect(DEFAULT_BOURBON_CUPS_PER_GALLON).toBe(1.5)
  })

  it('written recipe strength is 8:1 (2 cups/gal)', () => {
    expect(WRITTEN_BOURBON_CUPS_PER_GALLON).toBe(2)
  })
})
