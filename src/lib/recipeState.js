// The single shared recipe: planning inputs + the ingredient overrides
// layer. Persisted as one row in Supabase so both devices read/write the
// same current state. Last-write-wins, auto-saved on edit (debounced).

import { reactive, watch, toRaw } from 'vue'
import { supabase } from './supabaseClient.js'
import {
  DEFAULT_BOURBON_CUPS_PER_GALLON,
  DEFAULT_SERVING_OZ,
  DEFAULT_BATCH_SIZE_GAL,
} from './baseRecipe.js'

const ROW_ID = 1
const SAVE_DEBOUNCE_MS = 800

export function defaultState() {
  return {
    planningMode: 'servings',
    servingsTarget: 150,
    ciderGallons: 8,
    bourbonCupsPerGallon: DEFAULT_BOURBON_CUPS_PER_GALLON,
    servingOz: DEFAULT_SERVING_OZ,
    batchSizeGal: DEFAULT_BATCH_SIZE_GAL,
    overrides: {},
    shoppingChecked: {},
  }
}

function rowToState(row) {
  return {
    planningMode: row.planning_mode,
    servingsTarget: Number(row.servings_target),
    ciderGallons: Number(row.cider_gallons),
    bourbonCupsPerGallon: Number(row.bourbon_cups_per_gallon),
    servingOz: Number(row.serving_oz),
    batchSizeGal: Number(row.batch_size_gal),
    overrides: row.overrides ?? {},
    shoppingChecked: row.shopping_checked ?? {},
  }
}

function stateToRow(state) {
  return {
    id: ROW_ID,
    planning_mode: state.planningMode,
    servings_target: state.servingsTarget,
    cider_gallons: state.ciderGallons,
    bourbon_cups_per_gallon: state.bourbonCupsPerGallon,
    serving_oz: state.servingOz,
    batch_size_gal: state.batchSizeGal,
    overrides: state.overrides,
    shopping_checked: state.shoppingChecked,
  }
}

export function useRecipeState() {
  const state = reactive(defaultState())
  const meta = reactive({
    loading: true,
    saving: false,
    error: null,
    updatedAt: null,
    offline: !supabase,
  })

  let saveTimer = null
  let suppressNextSave = false
  let hasLoaded = false

  async function load() {
    if (!supabase) {
      meta.loading = false
      return
    }
    meta.loading = true
    meta.error = null
    const { data, error } = await supabase.from('recipe_state').select('*').eq('id', ROW_ID).maybeSingle()

    if (error) {
      meta.error = error.message
      meta.loading = false
      return
    }

    if (data) {
      suppressNextSave = true
      Object.assign(state, rowToState(data))
      meta.updatedAt = data.updated_at
    } else {
      // First run: seed the row with defaults.
      const { data: inserted, error: insertError } = await supabase
        .from('recipe_state')
        .insert(stateToRow(state))
        .select()
        .single()
      if (insertError) {
        meta.error = insertError.message
      } else {
        meta.updatedAt = inserted.updated_at
      }
    }

    hasLoaded = true
    meta.loading = false
  }

  async function save() {
    if (!supabase || !hasLoaded) return
    meta.saving = true
    meta.error = null
    const { data, error } = await supabase
      .from('recipe_state')
      .update({ ...stateToRow(toRaw(state)), updated_at: new Date().toISOString() })
      .eq('id', ROW_ID)
      .select()
      .single()

    if (error) {
      meta.error = error.message
    } else {
      meta.updatedAt = data.updated_at
    }
    meta.saving = false
  }

  watch(
    state,
    () => {
      if (suppressNextSave) {
        suppressNextSave = false
        return
      }
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(save, SAVE_DEBOUNCE_MS)
    },
    { deep: true },
  )

  function setOverride(key, amount) {
    state.overrides = { ...state.overrides, [key]: amount }
  }

  function resetIngredient(key) {
    const next = { ...state.overrides }
    delete next[key]
    state.overrides = next
  }

  function resetOverrides() {
    state.overrides = {}
  }

  function toggleShoppingItem(key) {
    state.shoppingChecked = { ...state.shoppingChecked, [key]: !state.shoppingChecked[key] }
  }

  function resetShoppingChecklist() {
    state.shoppingChecked = {}
  }

  function resetAll() {
    suppressNextSave = false
    Object.assign(state, defaultState())
  }

  load()

  return {
    state,
    meta,
    setOverride,
    resetIngredient,
    resetOverrides,
    resetAll,
    reload: load,
    toggleShoppingItem,
    resetShoppingChecklist,
  }
}
