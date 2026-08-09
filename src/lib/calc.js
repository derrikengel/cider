// Pure recipe math. No Vue, no Supabase — just numbers in, numbers out, so
// this is easy to unit test and easy to trust.
//
// Core model: gallons of cider is the master scaling unit. Every ingredient,
// the bourbon, and the serving yield all scale linearly off of it.

import { BASE_UNIT_GALLONS, INGREDIENTS } from './baseRecipe.js'
import {
  OZ_PER_GALLON,
  OZ_PER_CUP,
  OZ_PER_HALF_GALLON,
  ML_PER_BOTTLE,
  ozToMl,
  ceilToIncrement,
  roundToIncrement,
} from './units.js'

// --- Ratio cascade -----------------------------------------------------
//
// A serving is a fixed pour of the finished mixture (cider + bourbon), so the
// bourbon ratio determines how many servings a gallon of cider yields:
//
//   servings_per_gallon = (128oz + bourbon_cups_per_gallon * 8oz) / serving_oz

export function servingsPerGallon(bourbonCupsPerGallon, servingOz) {
  if (servingOz <= 0) throw new Error('servingOz must be positive')
  return (OZ_PER_GALLON + bourbonCupsPerGallon * OZ_PER_CUP) / servingOz
}

export function ciderGallonsForServings(servingsTarget, bourbonCupsPerGallon, servingOz) {
  return servingsTarget / servingsPerGallon(bourbonCupsPerGallon, servingOz)
}

export function servingsForCiderGallons(ciderGallons, bourbonCupsPerGallon, servingOz) {
  return ciderGallons * servingsPerGallon(bourbonCupsPerGallon, servingOz)
}

// Resolves the two-way planning input (plan by servings target, or by a
// fixed cider amount) down to the one number everything else scales from:
// the exact gallons of cider to make.
export function resolveCiderGallons({ planningMode, servingsTarget, ciderGallons, bourbonCupsPerGallon, servingOz }) {
  if (planningMode === 'cider') return ciderGallons
  return ciderGallonsForServings(servingsTarget, bourbonCupsPerGallon, servingOz)
}

// --- Totals --------------------------------------------------------------

export function computeTotals({ ciderGallons, bourbonCupsPerGallon, servingOz }) {
  const totalCiderOz = ciderGallons * OZ_PER_GALLON
  const totalBourbonCups = ciderGallons * bourbonCupsPerGallon
  const totalBourbonOz = totalBourbonCups * OZ_PER_CUP
  const totalMixtureOz = totalCiderOz + totalBourbonOz
  const estimatedServings = totalMixtureOz / servingOz

  return {
    totalCiderOz,
    totalBourbonCups,
    totalBourbonOz,
    totalMixtureOz,
    estimatedServings,
  }
}

// --- Overrides -------------------------------------------------------------
//
// Effective amount is the override for that ingredient if set, otherwise the
// base amount — both expressed per half gallon of cider, the same terms the
// base recipe is written in, so they scale identically into batches/totals.

export function effectivePerHalfGallon(ingredient, overrides) {
  const override = overrides?.[ingredient.key]
  return typeof override === 'number' ? override : ingredient.perHalfGallon
}

export function scaleIngredient(ingredient, overrides, gallons) {
  const perHalfGallon = effectivePerHalfGallon(ingredient, overrides)
  return perHalfGallon * (gallons / BASE_UNIT_GALLONS)
}

// Rounds a scaled ingredient amount to a kitchen-sensible increment. Whole
// items round to the nearest whole (minimum 1 if any amount is called for);
// tsp/tbsp round to a fraction a measuring spoon can actually hit.
export function roundIngredientAmount(ingredient, amount) {
  if (amount <= 0) return 0
  switch (ingredient.kind) {
    case 'count':
      return Math.max(1, Math.round(amount))
    case 'tsp':
      return Math.max(1 / 8, roundToIncrement(amount, 1 / 8))
    case 'tbsp':
      return Math.max(1 / 4, roundToIncrement(amount, 1 / 4))
    default:
      throw new Error(`Unknown ingredient kind: ${ingredient.kind}`)
  }
}

// --- Shopping list ---------------------------------------------------------
//
// Buy quantities round up to what's actually purchasable: cider in half-
// gallon increments, bourbon in whole 750ml bottles.

export function ciderShopping(ciderGallons) {
  const useOz = ciderGallons * OZ_PER_GALLON
  const buyOz = ceilToIncrement(useOz, OZ_PER_HALF_GALLON)
  return {
    useOz,
    useGallons: ciderGallons,
    buyOz,
    buyGallons: buyOz / OZ_PER_GALLON,
    buyMl: ozToMl(buyOz),
  }
}

export function bourbonShopping(totalBourbonCups) {
  const useOz = totalBourbonCups * OZ_PER_CUP
  const useMl = ozToMl(useOz)
  const buyBottles = Math.ceil(useMl / ML_PER_BOTTLE - 1e-9)
  return {
    useCups: totalBourbonCups,
    useOz,
    useMl,
    buyBottles,
  }
}

export function ingredientShoppingList(ciderGallons, overrides) {
  return INGREDIENTS.map((ingredient) => {
    const amount = scaleIngredient(ingredient, overrides, ciderGallons)
    return {
      key: ingredient.key,
      label: ingredient.label,
      unit: ingredient.unit,
      kind: ingredient.kind,
      amount,
      buyAmount: roundIngredientAmount(ingredient, amount),
      isOverridden: typeof overrides?.[ingredient.key] === 'number',
    }
  })
}

// --- Batch splitting ---------------------------------------------------
//
// The total is one number; the cooking batch size is a separate input. We
// cook as many full-size batches as possible, plus one smaller remainder
// batch if the total doesn't divide evenly. Every full batch is identical,
// so the cook follows one recipe card repeated N times.

const GALLON_EPSILON = 1e-6
const MIN_BATCH_GAL = OZ_PER_HALF_GALLON / OZ_PER_GALLON

export function planBatches({ ciderGallons, batchSizeGal, bourbonCupsPerGallon, overrides }) {
  if (batchSizeGal <= 0) throw new Error('batchSizeGal must be positive')

  let fullBatchCount = Math.floor(ciderGallons / batchSizeGal + GALLON_EPSILON)
  let remainderGal = Math.max(0, ciderGallons - fullBatchCount * batchSizeGal)

  // The finishing batch has to be a half-gallon multiple too — cider gets
  // measured out of half-gallon jugs, not to an arbitrary decimal — so round
  // it up rather than cooking whatever's strictly left over.
  if (remainderGal > GALLON_EPSILON) {
    remainderGal = ceilToIncrement(remainderGal, MIN_BATCH_GAL)
    if (remainderGal >= batchSizeGal - GALLON_EPSILON) {
      fullBatchCount += 1
      remainderGal = 0
    }
  }

  const batches = []
  if (fullBatchCount > 0) {
    batches.push(makeBatch(batchSizeGal, fullBatchCount, bourbonCupsPerGallon, overrides))
  }
  if (remainderGal > GALLON_EPSILON) {
    batches.push(makeBatch(remainderGal, 1, bourbonCupsPerGallon, overrides))
  }
  return batches
}

// Cider is only ever cooked in half-gallon increments (see MIN_BATCH_GAL and
// the remainder rounding above), so the batch plan's total is almost always
// slightly more cider than the raw planning target — this is the amount that
// actually gets bought and cooked, and what shopping quantities should be
// based on, not the raw target.
export function plannedCiderGallons(batches) {
  return batches.reduce((sum, batch) => sum + batch.sizeGal * batch.count, 0)
}

function makeBatch(sizeGal, count, bourbonCupsPerGallon, overrides) {
  const ingredients = INGREDIENTS.map((ingredient) => {
    const rawAmount = scaleIngredient(ingredient, overrides, sizeGal)
    return {
      key: ingredient.key,
      label: ingredient.label,
      unit: ingredient.unit,
      kind: ingredient.kind,
      amount: roundIngredientAmount(ingredient, rawAmount),
      isOverridden: typeof overrides?.[ingredient.key] === 'number',
    }
  })

  return {
    sizeGal,
    count,
    bourbonCups: sizeGal * bourbonCupsPerGallon,
    ingredients,
  }
}
