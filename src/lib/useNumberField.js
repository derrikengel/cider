// Backs a numeric input with a draft string that's decoupled from the
// shared recipe state while the field is focused. Typing a valid value
// commits immediately (live recalculation); clearing the field while still
// focused does nothing to the underlying state, so nothing recalculates and
// nothing can throw. Only blurring while the field is empty/invalid surfaces
// a validation error — the shared state still keeps its last good value, so
// the rest of the app never sees an invalid number and never breaks.

import { ref, watch } from 'vue'

export function useNumberField(getValue, setValue, { min = -Infinity, invalidMessage = 'Enter a valid number' } = {}) {
  const draft = ref(String(getValue()))
  const error = ref(null)
  let focused = false

  watch(getValue, (value) => {
    if (!focused) draft.value = String(value)
  })

  function isValid(n) {
    return Number.isFinite(n) && n >= min
  }

  function onInput(event) {
    draft.value = event.target.value
    const trimmed = event.target.value.trim()
    const n = Number(trimmed)
    if (trimmed !== '' && isValid(n)) {
      error.value = null
      setValue(n)
    }
  }

  function onFocus() {
    focused = true
    error.value = null
  }

  function onBlur() {
    focused = false
    const n = Number(draft.value.trim())
    if (draft.value.trim() === '' || !isValid(n)) {
      error.value = invalidMessage
      return
    }
    error.value = null
    setValue(n)
    draft.value = String(n)
  }

  return { draft, error, onInput, onFocus, onBlur }
}
