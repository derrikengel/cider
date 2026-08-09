<script setup>
    import { inject, computed } from 'vue'
    import { INGREDIENTS } from '../lib/baseRecipe.js'
    import {
        resolveCiderGallons,
        computeTotals,
        ciderShopping,
        effectivePerHalfGallon,
        planBatches,
        plannedCiderGallons,
    } from '../lib/calc.js'
    import { formatOzWithGallons, formatServings } from '../lib/display.js'
    import { useNumberField } from '../lib/useNumberField.js'

    const recipe = inject('recipe')
    const { state, setOverride, resetIngredient, resetOverrides } = recipe

    function resetEverything() {
        const confirmed = window.confirm(
            'Reset the whole recipe, including ingredient tweaks and planning values, back to defaults? All changes will be lost.',
        )
        if (confirmed) recipe.resetAll()
    }

    const servingsTargetField = useNumberField(
        () => state.servingsTarget,
        (n) => (state.servingsTarget = n),
        { min: 1, invalidMessage: 'Enter a number of servings' },
    )
    const ciderGallonsField = useNumberField(
        () => state.ciderGallons,
        (n) => (state.ciderGallons = n),
        { min: 0.5, invalidMessage: 'Enter an amount of cider greater than 0' },
    )
    const bourbonRatioField = useNumberField(
        () => state.bourbonCupsPerGallon,
        (n) => (state.bourbonCupsPerGallon = n),
        { min: 0, invalidMessage: 'Enter a bourbon ratio' },
    )
    const servingOzField = useNumberField(
        () => state.servingOz,
        (n) => (state.servingOz = n),
        { min: 1, invalidMessage: 'Enter a serving size greater than 0' },
    )
    const batchSizeField = useNumberField(
        () => state.batchSizeGal,
        (n) => (state.batchSizeGal = n),
        { min: 0.5, invalidMessage: 'Enter a batch size greater than 0' },
    )

    const targetCiderGallons = computed(() =>
        resolveCiderGallons({
            planningMode: state.planningMode,
            servingsTarget: state.servingsTarget,
            ciderGallons: state.ciderGallons,
            bourbonCupsPerGallon: state.bourbonCupsPerGallon,
            servingOz: state.servingOz,
        }),
    )

    // Cider is only ever cooked in half-gallon increments (see planBatches in
    // calc.js), so the batch plan's total — not the raw planning target — is
    // what actually gets bought and cooked. Every total and shopping quantity
    // below is based on that, so nothing here under-shoots what the Cook tab
    // will call for.
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
</script>

<template>
    <div class="flex flex-col gap-8">

        <section aria-labelledby="planning-heading" class="flex flex-col gap-4 rounded-xl bg-taupe-50 p-4">
            <div
                class="-mx-4 -mt-4 flex items-baseline justify-between gap-4 rounded-t-xl bg-yellow-700 p-4 text-white">
                <h2 id="planning-heading" class="text-xl font-semibold sm:text-2xl">Plan</h2>
                <button type="button"
                    class="text-xs text-yellow-100 underline decoration-dotted hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    @click="resetEverything">
                    Reset to defaults
                </button>
            </div>

            <!-- <p class="text-sm text-yellow-700 text-pretty">All batches are increments of a half
                gallon.</p> -->

            <fieldset class="flex flex-col gap-1">
                <legend class="text-sm font-medium text-taupe-700">What do you want to plan for?</legend>
                <div class="flex flex-row gap-4">
                    <label class="flex items-center gap-2 py-1.5 text-sm">
                        <input type="radio" name="planning-mode" value="servings" v-model="state.planningMode"
                            class="h-4 w-4 accent-taupe-600 bg-white" />
                        Number of servings
                    </label>
                    <label class="flex items-center gap-2 py-1.5 text-sm">
                        <input type="radio" name="planning-mode" value="cider" v-model="state.planningMode"
                            class="h-4 w-4 accent-taupe-600 bg-white" />
                        Gallons of cider
                    </label>
                </div>
            </fieldset>

            <div v-if="state.planningMode === 'servings'"
                class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <label for="servings-target"
                    class="text-sm font-medium text-taupe-700 text-pretty sm:w-56 sm:shrink-0">Number of
                    servings</label>
                <div class="flex flex-col gap-1 sm:w-28">
                    <input id="servings-target" type="number" inputmode="numeric" min="1" step="1"
                        :value="servingsTargetField.draft.value" @input="servingsTargetField.onInput"
                        @focus="servingsTargetField.onFocus" @blur="servingsTargetField.onBlur"
                        class="w-full rounded bg-white border border-taupe-300 px-3 py-2"
                        :class="{ 'border-red-500': servingsTargetField.error.value }" />
                    <p v-if="servingsTargetField.error.value" class="text-xs text-red-600">{{
                        servingsTargetField.error.value }}</p>
                </div>
            </div>
            <div v-else class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <label for="cider-amount"
                    class="text-sm font-medium text-taupe-700 text-pretty sm:w-56 sm:shrink-0">Gallons of
                    cider (not including bourbon)</label>
                <div class="flex flex-col gap-1 sm:w-28">
                    <input id="cider-amount" type="number" inputmode="decimal" min="0.5" step="0.5"
                        :value="ciderGallonsField.draft.value" @input="ciderGallonsField.onInput"
                        @focus="ciderGallonsField.onFocus" @blur="ciderGallonsField.onBlur"
                        class="w-full rounded bg-white border border-taupe-300 px-3 py-2"
                        :class="{ 'border-red-500': ciderGallonsField.error.value }" />
                    <p v-if="ciderGallonsField.error.value" class="text-xs text-red-600">{{
                        ciderGallonsField.error.value }}</p>
                </div>
            </div>

            <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <label for="bourbon-ratio" class="text-sm font-medium text-taupe-700 text-pretty sm:w-56 sm:shrink-0">
                    Cups of bourbon per gallon of cider
                </label>
                <div class="flex flex-col gap-1 sm:w-28">
                    <input id="bourbon-ratio" type="number" inputmode="decimal" min="0" step="0.1"
                        :value="bourbonRatioField.draft.value" @input="bourbonRatioField.onInput"
                        @focus="bourbonRatioField.onFocus" @blur="bourbonRatioField.onBlur"
                        class="w-full rounded bg-white border border-taupe-300 px-3 py-2"
                        :class="{ 'border-red-500': bourbonRatioField.error.value }" />
                    <p v-if="bourbonRatioField.error.value" class="text-xs text-red-600">{{
                        bourbonRatioField.error.value }}</p>
                </div>
            </div>

            <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <label for="serving-oz"
                    class="text-sm font-medium text-taupe-700 text-pretty sm:w-56 sm:shrink-0">Serving size
                    (ounces)</label>
                <div class="flex flex-col gap-1 sm:w-28">
                    <input id="serving-oz" type="number" inputmode="numeric" min="1" step="1"
                        :value="servingOzField.draft.value" @input="servingOzField.onInput"
                        @focus="servingOzField.onFocus" @blur="servingOzField.onBlur"
                        class="w-full rounded bg-white border border-taupe-300 px-3 py-2"
                        :class="{ 'border-red-500': servingOzField.error.value }" />
                    <p v-if="servingOzField.error.value" class="text-xs text-red-600">{{ servingOzField.error.value
                        }}</p>
                </div>
            </div>

            <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <label for="batch-size" class="text-sm font-medium text-taupe-700 text-pretty sm:w-56 sm:shrink-0">
                    Cooking batch size (gallons)
                </label>
                <div class="flex flex-col gap-1 sm:w-28">
                    <input id="batch-size" type="number" inputmode="decimal" min="0.5" step="0.5"
                        :value="batchSizeField.draft.value" @input="batchSizeField.onInput"
                        @focus="batchSizeField.onFocus" @blur="batchSizeField.onBlur"
                        class="w-full rounded bg-white border border-taupe-300 px-3 py-2"
                        :class="{ 'border-red-500': batchSizeField.error.value }" />
                    <p v-if="batchSizeField.error.value" class="text-xs text-red-600">{{ batchSizeField.error.value
                        }}</p>
                </div>
            </div>


            <p class="text-sm text-taupe-600 text-pretty">
                That's about <strong>{{ formatOzWithGallons(cider.useOz) }}</strong> of cider, an estimated
                <strong>{{ formatServings(totals.estimatedServings) }} servings</strong>.
            </p>
        </section>

        <section aria-labelledby="overrides-heading" class="flex flex-col gap-3 rounded-xl bg-taupe-50 p-4">
            <div
                class="-mx-4 -mt-4 flex items-baseline justify-between gap-4 rounded-t-xl bg-yellow-700 p-4 text-white">
                <h2 id="overrides-heading" class="text-xl font-semibold sm:text-2xl">Tweak Ingredients</h2>
                <button v-if="hasAnyOverride" type="button"
                    class="text-xs text-yellow-100 underline decoration-dotted hover:text-white"
                    @click="resetOverrides">
                    Reset to defaults
                </button>
            </div>
            <p class="text-sm text-yellow-700">
                Amounts are per half gallon of cider so they scale correctly into totals and batches.
            </p>

            <p class="text-sm font-medium text-taupe-700 text-pretty">Optionally, tweak ingredient amounts below to
                adjust the recipe.</p>

            <ul class="flex flex-col gap-2">
                <li v-for="ingredient in INGREDIENTS" :key="ingredient.key"
                    class="flex flex-col gap-2 rounded border border-taupe-200 px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    <label :for="`override-${ingredient.key}`"
                        class="flex flex-wrap items-baseline gap-x-2 text-sm font-medium sm:w-48 sm:shrink-0">
                        {{ ingredient.label }}
                        <span v-if="isOverridden(ingredient.key)" class="text-xs text-yellow-700">
                            (default {{ ingredient.perHalfGallon }})
                        </span>
                    </label>
                    <div class="flex flex-wrap items-center gap-3 sm:flex-1">
                        <input :id="`override-${ingredient.key}`" type="number" inputmode="decimal" min="0" step="any"
                            :value="overrideValue(ingredient)" @change="onOverrideInput(ingredient.key, $event)"
                            class="w-24 shrink-0 rounded bg-white border border-taupe-300 px-2 py-2 text-sm" />
                        <span class="shrink-0 text-xs text-taupe-500 sm:w-36">{{ ingredient.unit }} / half
                            gallon</span>
                        <button v-if="isOverridden(ingredient.key)" type="button"
                            class="text-xs text-taupe-500 underline decoration-dotted hover:text-taupe-800"
                            @click="resetIngredient(ingredient.key)">
                            Reset
                        </button>
                    </div>
                </li>
            </ul>
        </section>
    </div>
</template>
