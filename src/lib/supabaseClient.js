import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn(
    'Supabase env vars are missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). ' +
      'The recipe will not load or save until these are set.',
  )
}

export const supabase = url && anonKey ? createClient(url, anonKey) : null
