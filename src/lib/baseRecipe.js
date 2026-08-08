// The canonical recipe, written per half gallon of cider. This is a constant:
// it is never written to, and never overwritten by user edits. It is the
// starting point on first load and the target of "reset to base amount".
// User tweaks live in a separate overrides layer (see recipeState.js).

export const BASE_UNIT_GALLONS = 0.5

// kind drives both the rounding increment used when scaling into a batch and
// how the amount is displayed:
//   'count' -> whole items, rounded to the nearest 1
//   'tsp'   -> rounded to the nearest 1/8 tsp
//   'tbsp'  -> rounded to the nearest 1/4 tbsp
export const INGREDIENTS = [
  {
    key: 'orange',
    label: 'Orange, quartered',
    unit: 'whole',
    kind: 'count',
    perHalfGallon: 1,
  },
  {
    key: 'cloves',
    label: 'Whole cloves',
    unit: 'whole',
    kind: 'count',
    perHalfGallon: 12,
  },
  {
    key: 'cinnamonSticks',
    label: 'Cinnamon sticks (3-inch)',
    unit: 'stick',
    kind: 'count',
    perHalfGallon: 4,
  },
  {
    key: 'allspice',
    label: 'Allspice berries',
    unit: 'whole',
    kind: 'count',
    perHalfGallon: 15,
  },
  {
    key: 'nutmeg',
    label: 'Ground nutmeg',
    unit: 'tsp',
    kind: 'tsp',
    perHalfGallon: 0.25,
  },
  {
    key: 'cardamom',
    label: 'Cardamom pods',
    unit: 'whole',
    kind: 'count',
    perHalfGallon: 7,
  },
  {
    key: 'brownSugar',
    label: 'Brown sugar (unpacked)',
    unit: 'tbsp',
    kind: 'tbsp',
    perHalfGallon: 3,
  },
]

// Bourbon is not a fixed per-half-gallon ingredient — it is a ratio (cups of
// bourbon per gallon of cider) that gets re-tested and adjusted separately.
// See lib/calc.js for how it enters the yield math.
export const DEFAULT_BOURBON_CUPS_PER_GALLON = 1.5 // ~10:1, the Halloween default
export const WRITTEN_BOURBON_CUPS_PER_GALLON = 2 // 8:1, the recipe as written

export const DEFAULT_SERVING_OZ = 8
export const DEFAULT_BATCH_SIZE_GAL = 1

export const DIRECTIONS = [
  'Add all ingredients except the bourbon to the pot, cover, and heat on medium-high.',
  'Keep it covered; bring to a simmer, then reduce the heat to low.',
  'Simmer 20 minutes on low, covered.',
  'Strain out the orange and spices.',
  'Stir in the bourbon after straining, off the heat, then serve.',
]

export function findIngredient(key) {
  const ingredient = INGREDIENTS.find((i) => i.key === key)
  if (!ingredient) throw new Error(`Unknown ingredient: ${key}`)
  return ingredient
}
