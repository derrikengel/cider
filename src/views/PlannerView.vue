<script setup>
import { inject, computed } from 'vue'
import { INGREDIENTS, DEFAULT_BOURBON_CUPS_PER_GALLON, WRITTEN_BOURBON_CUPS_PER_GALLON } from '../lib/baseRecipe.js'
import {
  resolveCiderGallons,
  computeTotals,
  ciderShopping,
  bourbonShopping,
  ingredientShoppingList,
  effectivePerHalfGallon,
} from '../lib/calc.js'
import { formatOzWithGallons, formatServings, formatIngredientAmount, formatGallons } from '../lib/display.js'

const { state, setOverride, resetIngredient, resetOverrides } = inject('recipe')

const ciderGallons = computed(() =>
  resolveCiderGallons({
    planningMode: state.planningMode,
    servingsTarget: state.servingsTarget,
    ciderGallons: state.ciderGallons,
    bourbonCupsPerGallon: state.bourbonCupsPerGallon,
    servingOz: state.servingOz,
  }),
)

const totals = computed(() =>
  computeTotals({
    ciderGallons: ciderGallons.value,
    bourbonCupsPerGallon: state.bourbonCupsPerGallon,
    servingOz: state.servingOz,
  }),
)

const cider = computed(() => ciderShopping(ciderGallons.value))
const bourbon = computed(() => bourbonShopping(totals.value.totalBourbonCups))
const ingredients = computed(() => ingredientShoppingList(ciderGallons.value, state.overrides))

const hasAnyOverride = computed(() => Object.keys(state.overrides).length > 0)

function overrideValue(ingredient) {
  return effectivePerHalfGallon(ingredient, state.overrides)
}

function onOverrideInput(key, event) {
  const num = Number(event.target.value)
  if (Number.isFinite(num) && num >= 0) setOverride(key, num)
}

function isOverridden(key) {
  return typeof state.overrides[key] === 'number'
}

function formatGallonsLabel(gallons) {
  return formatGallons(gallons, { precision: gallons % 1 === 0 ? 0 : 2 })
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <section aria-labelledby="planning-heading" class="flex flex-col gap-4">
      <h2 id="planning-heading" class="text-lg font-semibold">Plan</h2>

      <fieldset class="flex flex-col gap-2">
        <legend class="text-sm font-medium text-slate-700 dark:text-slate-300">How do you want to plan?</legend>
        <label class="flex items-center gap-2 text-sm">
          <input type="radio" name="planning-mode" value="servings" v-model="state.planningMode" class="accent-amber-600" />
          Target number of servings
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="radio" name="planning-mode" value="cider" v-model="state.planningMode" class="accent-amber-600" />
          Fixed amount of cider (gallons)
        </label>
      </fieldset>

      <div v-if="state.planningMode === 'servings'" class="flex flex-col gap-1">
        <label for="servings-target" class="text-sm font-medium text-slate-700 dark:text-slate-300">Servings needed</label>
        <input
          id="servings-target"
          type="number"
          min="1"
          step="1"
          v-model.number="state.servingsTarget"
          class="w-40 rounded border border-slate-300 px-3 py-1.5 dark:border-slate-600 dark:bg-slate-800"
        />
      </div>
      <div v-else class="flex flex-col gap-1">
        <label for="cider-amount" class="text-sm font-medium text-slate-700 dark:text-slate-300">Cider to make (gallons)</label>
        <input
          id="cider-amount"
          type="number"
          min="0.5"
          step="0.5"
          v-model.number="state.ciderGallons"
          class="w-40 rounded border border-slate-300 px-3 py-1.5 dark:border-slate-600 dark:bg-slate-800"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label for="bourbon-ratio" class="text-sm font-medium text-slate-700 dark:text-slate-300">
          Bourbon ratio (cups per gallon of cider)
        </label>
        <div class="flex flex-wrap items-center gap-2">
          <input
            id="bourbon-ratio"
            type="number"
            min="0"
            step="0.1"
            v-model.number="state.bourbonCupsPerGallon"
            class="w-28 rounded border border-slate-300 px-3 py-1.5 dark:border-slate-600 dark:bg-slate-800"
          />
          <button
            type="button"
            class="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
            @click="state.bourbonCupsPerGallon = DEFAULT_BOURBON_CUPS_PER_GALLON"
          >
            Halloween ~10:1 (1.5)
          </button>
          <button
            type="button"
            class="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
            @click="state.bourbonCupsPerGallon = WRITTEN_BOURBON_CUPS_PER_GALLON"
          >
            Recipe strength 8:1 (2)
          </button>
        </div>
      </div>

      <div class="flex flex-wrap gap-6">
        <div class="flex flex-col gap-1">
          <label for="serving-oz" class="text-sm font-medium text-slate-700 dark:text-slate-300">Serving size (oz)</label>
          <input
            id="serving-oz"
            type="number"
            min="1"
            step="1"
            v-model.number="state.servingOz"
            class="w-28 rounded border border-slate-300 px-3 py-1.5 dark:border-slate-600 dark:bg-slate-800"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="batch-size" class="text-sm font-medium text-slate-700 dark:text-slate-300">
            Cooking batch size (gallons)
          </label>
          <input
            id="batch-size"
            type="number"
            min="0.25"
            step="0.25"
            v-model.number="state.batchSizeGal"
            class="w-28 rounded border border-slate-300 px-3 py-1.5 dark:border-slate-600 dark:bg-slate-800"
          />
        </div>
      </div>

      <p class="text-sm text-slate-600 dark:text-slate-400">
        That's about <strong>{{ formatOzWithGallons(cider.useOz) }}</strong> of cider, an estimated
        <strong>{{ formatServings(totals.estimatedServings) }} servings</strong>.
      </p>
    </section>

    <section aria-labelledby="shopping-heading" class="flex flex-col gap-3">
      <h2 id="shopping-heading" class="text-lg font-semibold">Shopping list</h2>
      <p class="text-sm text-slate-600 dark:text-slate-400">
        These are <strong>estimates</strong> — actual yield runs a bit lower than the math because cider
        evaporates while mulling.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-slate-300 text-left dark:border-slate-600">
              <th scope="col" class="py-2 pr-4 font-medium">Item</th>
              <th scope="col" class="py-2 pr-4 font-medium">Use</th>
              <th scope="col" class="py-2 font-medium">Buy</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-slate-200 dark:border-slate-700">
              <th scope="row" class="py-2 pr-4 font-normal">Apple cider</th>
              <td class="py-2 pr-4">{{ formatOzWithGallons(cider.useOz) }}</td>
              <td class="py-2">{{ formatGallonsLabel(cider.buyGallons) }}</td>
            </tr>
            <tr class="border-b border-slate-200 dark:border-slate-700">
              <th scope="row" class="py-2 pr-4 font-normal">Bourbon</th>
              <td class="py-2 pr-4">{{ bourbon.useCups.toFixed(2) }} cups ({{ bourbon.useOz.toFixed(0) }} oz / {{ bourbon.useMl.toFixed(0) }} ml)</td>
              <td class="py-2">{{ bourbon.buyBottles }} × 750&nbsp;ml bottle{{ bourbon.buyBottles === 1 ? '' : 's' }}</td>
            </tr>
            <tr v-for="ingredient in ingredients" :key="ingredient.key" class="border-b border-slate-200 dark:border-slate-700">
              <th scope="row" class="py-2 pr-4 font-normal">
                {{ ingredient.label }}
                <span v-if="ingredient.isOverridden" class="ml-1 text-xs text-amber-600 dark:text-amber-400">(edited)</span>
              </th>
              <td class="py-2 pr-4" colspan="2">
                {{ formatIngredientAmount(ingredient, ingredient.amount, { asCups: ingredient.key === 'brownSugar' }) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section aria-labelledby="overrides-heading" class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h2 id="overrides-heading" class="text-lg font-semibold">Ingredient tweaks</h2>
        <button
          v-if="hasAnyOverride"
          type="button"
          class="text-xs text-slate-500 underline decoration-dotted hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
          @click="resetOverrides"
        >
          Reset all ingredients to base
        </button>
      </div>
      <p class="text-sm text-slate-600 dark:text-slate-400">
        Amounts are per ½ gallon of cider (the base recipe unit) so they scale correctly into totals and
        batches.
      </p>

      <ul class="flex flex-col gap-2">
        <li
          v-for="ingredient in INGREDIENTS"
          :key="ingredient.key"
          class="flex flex-wrap items-center gap-3 rounded border border-slate-200 px-3 py-2 dark:border-slate-700"
        >
          <label :for="`override-${ingredient.key}`" class="min-w-48 flex-1 text-sm">
            {{ ingredient.label }}
            <span v-if="isOverridden(ingredient.key)" class="ml-1 text-xs text-amber-600 dark:text-amber-400">
              (edited, base {{ ingredient.perHalfGallon }})
            </span>
          </label>
          <input
            :id="`override-${ingredient.key}`"
            type="number"
            min="0"
            step="any"
            :value="overrideValue(ingredient)"
            @change="onOverrideInput(ingredient.key, $event)"
            class="w-24 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
          <span class="w-16 text-xs text-slate-500 dark:text-slate-400">{{ ingredient.unit }} / ½ gal</span>
          <button
            v-if="isOverridden(ingredient.key)"
            type="button"
            class="text-xs text-slate-500 underline decoration-dotted hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            @click="resetIngredient(ingredient.key)"
          >
            Reset
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
