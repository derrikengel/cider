<script setup>
    import { inject, computed } from 'vue'
    import {
        resolveCiderGallons,
        computeTotals,
        ciderShopping,
        bourbonShopping,
        ingredientShoppingList,
        planBatches,
        plannedCiderGallons,
    } from '../lib/calc.js'
    import { formatOzWithGallons, formatIngredientAmount, formatGallons } from '../lib/display.js'

    const recipe = inject('recipe')
    const { state, toggleShoppingItem, resetShoppingChecklist } = recipe

    const targetCiderGallons = computed(() =>
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
            ciderGallons: targetCiderGallons.value,
            batchSizeGal: state.batchSizeGal,
            bourbonCupsPerGallon: state.bourbonCupsPerGallon,
            overrides: state.overrides,
        }),
    )
    const ciderGallons = computed(() => plannedCiderGallons(batches.value))

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

    function formatGallonsLabel(gallons) {
        return formatGallons(gallons, { precision: gallons % 1 === 0 ? 0 : 2 })
    }

    function isChecked(key) {
        return Boolean(state.shoppingChecked[key])
    }

    const hasAnyChecked = computed(() => Object.values(state.shoppingChecked).some(Boolean))
</script>

<template>
    <div class="flex flex-col gap-8">
        <section aria-labelledby="shopping-heading"
            class="flex flex-col gap-3 rounded-xl bg-taupe-50 p-4">
            <div
                class="-mx-4 -mt-4 flex items-baseline justify-between gap-4 rounded-t-xl bg-yellow-700 p-4 text-white">
                <h2 id="shopping-heading" class="text-xl font-semibold sm:text-2xl">Shopping list</h2>
                <button v-if="hasAnyChecked" type="button"
                    class="text-xs text-yellow-100 underline decoration-dotted hover:text-white"
                    @click="resetShoppingChecklist">
                    Uncheck all
                </button>
            </div>
            <p class="text-sm text-yellow-700">
                These are <strong>estimates</strong> — actual yield runs a lower because cider evaporates while mulling.
            </p>
            <p class="text-sm font-medium text-taupe-700">Check off items that we have.</p>

            <ul class="flex flex-col gap-2">
                <li>
                    <label
                        class="flex cursor-pointer items-start gap-3 rounded-lg border border-taupe-200 px-3 py-3"
                        :class="isChecked('cider') ? 'bg-taupe-200' : 'bg-white'">
                        <input type="checkbox" class="mt-1 h-4 w-4 shrink-0 accent-taupe-600"
                            :checked="isChecked('cider')" @change="toggleShoppingItem('cider')" />
                        <div class="min-w-0 flex-1">
                            <p class="font-medium" :class="{ 'line-through': isChecked('cider') }">Apple cider</p>
                            <p class="text-sm text-taupe-600">Need {{
                                formatGallonsLabel(cider.buyGallons) }}</p>
                            <p class="text-sm text-taupe-600">Use {{
                                formatOzWithGallons(cider.useOz) }}
                            </p>
                        </div>
                    </label>
                </li>
                <li>
                    <label
                        class="flex cursor-pointer items-start gap-3 rounded-lg border border-taupe-200 px-3 py-3"
                        :class="isChecked('bourbon') ? 'bg-taupe-200' : 'bg-white'">
                        <input type="checkbox" class="mt-1 h-4 w-4 shrink-0 accent-taupe-600"
                            :checked="isChecked('bourbon')" @change="toggleShoppingItem('bourbon')" />
                        <div class="min-w-0 flex-1">
                            <p class="font-medium" :class="{ 'line-through': isChecked('bourbon') }">Bourbon</p>
                            <p class="text-sm text-taupe-600">
                                Need {{ bourbon.buyBottles }}x 750&nbsp;ml bottle{{ bourbon.buyBottles === 1 ? '' : 's'
                                }}
                            </p>
                            <p class="text-sm text-taupe-600">
                                Use {{ bourbon.useCups.toFixed(2) }} cups ({{ bourbon.useOz.toFixed(0) }} oz / {{
                                    bourbon.useMl.toFixed(0) }} ml)
                            </p>
                        </div>
                    </label>
                </li>
                <li v-for="ingredient in ingredients" :key="ingredient.key">
                    <label
                        class="flex cursor-pointer items-start gap-3 rounded-lg border border-taupe-200 px-3 py-3"
                        :class="isChecked(ingredient.key) ? 'bg-taupe-200' : 'bg-white'">
                        <input type="checkbox" class="mt-1 h-4 w-4 shrink-0 accent-taupe-600"
                            :checked="isChecked(ingredient.key)" @change="toggleShoppingItem(ingredient.key)" />
                        <div class="min-w-0 flex-1">
                            <p class="font-medium" :class="{ 'line-through': isChecked(ingredient.key) }">
                                {{ ingredient.label }}
                                <span v-if="ingredient.isOverridden"
                                    class="ml-1 text-xs text-yellow-700">(edited)</span>
                            </p>
                            <p class="text-sm text-taupe-600">
                                Need {{ formatIngredientAmount(ingredient, ingredient.buyAmount, {
                                    asCups: ingredient.key ===
                                        'brownSugar'
                                }) }}
                            </p>
                        </div>
                    </label>
                </li>
            </ul>
        </section>
    </div>
</template>
