import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Login/sync e autorização são camadas opcionais sobre o app 100% offline —
// se nenhum projeto Supabase estiver configurado, `supabase` fica null e o app
// opera normalmente usando localStorage.
export const supabase = url && anonKey ? createClient(url, anonKey) : null
