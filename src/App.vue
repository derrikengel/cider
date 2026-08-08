<script setup>
import { computed, provide, ref } from 'vue'
import { useRecipeState } from './lib/recipeState.js'
import PlannerView from './views/PlannerView.vue'
import CookView from './views/CookView.vue'

const recipe = useRecipeState()
const { state, meta } = recipe
provide('recipe', recipe)

const TABS = [
  { id: 'cook', label: 'Cook' },
  { id: 'plan', label: 'Plan' },
]

// Cook is the default: opening the bookmark should show the recipe with no
// decisions to make. Planning is the power-user path, off to the side.
const activeTab = ref('cook')
const tabRefs = ref({})

function selectTab(id) {
  activeTab.value = id
}

function onTabKeydown(event) {
  const currentIndex = TABS.findIndex((t) => t.id === activeTab.value)
  let nextIndex = null
  if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % TABS.length
  else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + TABS.length) % TABS.length
  else if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = TABS.length - 1
  else return

  event.preventDefault()
  const nextId = TABS[nextIndex].id
  activeTab.value = nextId
  tabRefs.value[nextId]?.focus()
}

const updatedAtLabel = computed(() => {
  if (!meta.updatedAt) return null
  const date = new Date(meta.updatedAt)
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
})

function resetEverything() {
  const confirmed = window.confirm(
    'Reset the whole recipe — ingredient tweaks and planning inputs — back to defaults? This affects the shared recipe both of you see.',
  )
  if (confirmed) recipe.resetAll()
}
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
    <header class="no-print border-b border-slate-200 dark:border-slate-700">
      <div class="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center justify-between gap-4">
          <h1 class="text-xl font-semibold">🥃 Bourbon Cider Calculator</h1>
        </div>

        <div class="flex items-center gap-4">
          <div role="tablist" aria-label="View" class="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              v-for="tab in TABS"
              :key="tab.id"
              :ref="(el) => (tabRefs[tab.id] = el)"
              role="tab"
              :id="`tab-${tab.id}`"
              :aria-selected="activeTab === tab.id"
              :aria-controls="`panel-${tab.id}`"
              :tabindex="activeTab === tab.id ? 0 : -1"
              class="rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
              :class="
                activeTab === tab.id
                  ? 'bg-white text-amber-700 shadow-sm dark:bg-slate-700 dark:text-amber-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              "
              @click="selectTab(tab.id)"
              @keydown="onTabKeydown"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>
      </div>

      <div
        class="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 pb-3 text-xs text-slate-500 dark:text-slate-400"
      >
        <p>
          <span v-if="meta.loading">Loading shared recipe…</span>
          <span v-else-if="meta.offline">Not connected to Supabase — changes won't be saved.</span>
          <span v-else-if="updatedAtLabel">Last updated {{ updatedAtLabel }}</span>
          <span v-else>Not saved yet.</span>
          <span v-if="meta.saving" class="italic"> · saving…</span>
        </p>
        <button
          type="button"
          class="rounded px-2 py-1 text-slate-500 underline decoration-dotted hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:text-slate-400 dark:hover:text-slate-100"
          @click="resetEverything"
        >
          Reset everything to defaults
        </button>
      </div>

      <p
        v-if="meta.error"
        role="alert"
        class="mx-auto max-w-3xl px-4 pb-3 text-sm text-red-600 dark:text-red-400"
      >
        Couldn't sync with Supabase: {{ meta.error }}
      </p>
    </header>

    <main class="mx-auto max-w-3xl px-4 py-6">
      <section
        v-show="activeTab === 'cook'"
        id="panel-cook"
        role="tabpanel"
        aria-labelledby="tab-cook"
        tabindex="0"
      >
        <CookView />
      </section>
      <section
        v-show="activeTab === 'plan'"
        id="panel-plan"
        role="tabpanel"
        aria-labelledby="tab-plan"
        tabindex="0"
      >
        <PlannerView />
      </section>
    </main>
  </div>
</template>
