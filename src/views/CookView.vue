<script setup>
import { inject, computed } from 'vue'
import { DIRECTIONS } from '../lib/baseRecipe.js'
import { resolveCiderGallons, planBatches } from '../lib/calc.js'
import { formatIngredientAmount, formatGallons } from '../lib/display.js'
import { formatMixedNumber } from '../lib/units.js'

const { state } = inject('recipe')

const ciderGallons = computed(() =>
  resolveCiderGallons({
    planningMode: state.planningMode,
    servingsTarget: state.servingsTarget,
    ciderGallons: state.ciderGallons,
    bourbonCupsPerGallon: state.bourbonCupsPerGallon,
    servingOz: state.servingOz,
  }),
)

const batches = computed(() =>
  planBatches({
    ciderGallons: ciderGallons.value,
    batchSizeGal: state.batchSizeGal,
    bourbonCupsPerGallon: state.bourbonCupsPerGallon,
    overrides: state.overrides,
  }),
)

function batchTitle(batch, index) {
  if (batch.count > 1) return `Batch (cook ${batch.count} times, identical)`
  if (index === 1) return 'Finishing batch (smaller)'
  return 'Batch'
}

function formatBourbon(cups) {
  return `${formatMixedNumber(cups, 8)} cup${cups > 1 ? 's' : ''} bourbon`
}
</script>

<template>
  <div class="flex flex-col gap-8 text-lg leading-relaxed">
    <div class="no-print flex justify-end">
      <button
        type="button"
        class="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:border-slate-600 dark:hover:bg-slate-800"
        @click="window.print()"
      >
        Print
      </button>
    </div>

    <p class="rounded-lg bg-amber-50 px-4 py-3 text-base text-amber-900 dark:bg-amber-950 dark:text-amber-200">
      Keep the pot <strong>covered</strong> and the heat <strong>low</strong> once it's simmering — a hard boil
      evaporates too much cider and cuts your yield.
    </p>

    <section v-for="(batch, index) in batches" :key="index" :aria-labelledby="`batch-heading-${index}`" class="flex flex-col gap-4 rounded-xl border border-slate-200 p-5 dark:border-slate-700">
      <h2 :id="`batch-heading-${index}`" class="text-2xl font-semibold">
        {{ batchTitle(batch, index) }} — {{ formatGallons(batch.sizeGal, { precision: batch.sizeGal % 1 === 0 ? 0 : 2 }) }}
      </h2>

      <ul class="flex flex-col gap-2">
        <li v-for="ingredient in batch.ingredients" :key="ingredient.key">
          {{ formatIngredientAmount(ingredient, ingredient.amount) }}
        </li>
        <li class="font-medium">{{ formatBourbon(batch.bourbonCups) }} — added after straining, off the heat</li>
      </ul>
    </section>

    <section aria-labelledby="directions-heading" class="flex flex-col gap-3">
      <h2 id="directions-heading" class="text-2xl font-semibold">Directions</h2>
      <ol class="flex flex-col gap-3 pl-6 list-decimal">
        <li v-for="(step, index) in DIRECTIONS" :key="index">{{ step }}</li>
      </ol>
    </section>
  </div>
</template>
