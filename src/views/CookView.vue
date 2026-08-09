<script setup>
    import { inject, computed } from 'vue'
    import { DIRECTIONS } from '../lib/baseRecipe.js'
    import { resolveCiderGallons, planBatches } from '../lib/calc.js'
    import { formatIngredientAmountParts, formatGallons } from '../lib/display.js'
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

    function batchTitle(batch, index, allBatches) {
        if (batch.count > 1) return `${batch.count} Full Batches`
        const isSmaller = allBatches.some((other) => other !== batch && other.sizeGal > batch.sizeGal)
        return isSmaller ? 'Final Batch (smaller)' : 'Recipe'
    }

    function cookRows(batch) {
        return [
            {
                key: 'cider',
                quantity: formatGallons(batch.sizeGal, { precision: batch.sizeGal % 1 === 0 ? 0 : 2 }),
                label: 'Apple cider',
            },
            ...batch.ingredients.map((ingredient) => ({
                key: ingredient.key,
                ...formatIngredientAmountParts(ingredient, ingredient.amount),
            })),
        ]
    }
</script>

<template>
    <div class="flex flex-col gap-5 text-base leading-relaxed sm:gap-8 sm:text-lg">

        <section v-for="(batch, index) in batches" :key="index" :aria-labelledby="`batch-heading-${index}`"
            class="flex flex-col rounded-xl bg-taupe-50 p-4">
            <h2 :id="`batch-heading-${index}`"
                class="-mx-4 -mt-4 mb-2 rounded-t-xl bg-yellow-700 p-4 text-white text-xl font-semibold sm:text-2xl">
                {{ batchTitle(batch, index, batches) }}
            </h2>

            <ul class="flex flex-col divide-y divide-taupe-200">
                <li v-for="row in cookRows(batch)" :key="row.key"
                    class="grid grid-cols-[5.5rem_1fr] items-baseline gap-x-3 py-2 sm:grid-cols-[7rem_1fr] sm:py-2.5">
                    <span class="text-right font-bold tabular-nums">{{ row.quantity }}</span>
                    <span>{{ row.label }}</span>
                </li>
            </ul>

            <div class="-mx-4 -mb-4 mt-2 p-4 rounded-b-xl bg-taupe-100">
                <div class="grid grid-cols-[5.5rem_1fr] items-baseline gap-x-3 sm:grid-cols-[7rem_1fr]">
                    <span class="text-right font-bold tabular-nums">
                        {{ formatMixedNumber(batch.bourbonCups, 8) }} cup{{ batch.bourbonCups > 1 ? 's' : '' }}
                    </span>
                    <span>Bourbon</span>
                </div>
                <p class="mt-1 pl-25 text-sm text-balance text-taupe-500 sm:pl-31 sm:text-base">
                    Added after straining — do not cook.
                </p>
            </div>
        </section>

        <section aria-labelledby="directions-heading" class="flex flex-col rounded-xl bg-taupe-50 p-4">
            <h2 id="directions-heading"
                class="-mx-4 -mt-4 mb-4 rounded-t-xl bg-yellow-700 p-4 text-white text-xl font-semibold sm:text-2xl">
                Directions</h2>
            <p class="rounded-lg bg-taupe-200 px-3 py-3 mb-4 text-taupe-900 sm:px-4 sm:text-base">
                Keep the pot <strong>covered</strong> and the heat <strong>low</strong> once it's simmering — a hard
                boil evaporates cider, reducing yield.
            </p>
            <ol class="flex flex-col gap-3 pl-5 list-decimal sm:pl-6">
                <li v-for="(step, index) in DIRECTIONS" :key="index">{{ step }}</li>
            </ol>
        </section>
    </div>
</template>
