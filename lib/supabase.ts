import { createClient } from '@supabase/supabase-js'

let supabaseInstance: ReturnType<typeof createClient> | null = null

export const supabase = () => {
  // In browser → create if not exists
  if (typeof window !== 'undefined') {
    if (!supabaseInstance) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key) {
        console.error('Missing Supabase env vars')
        throw new Error('Supabase not configured')
      }

      supabaseInstance = createClient(url, key)
    }
    return supabaseInstance
  }

  // Server / build time → return dummy or throw meaningfully
  // (prevents build crash, but you'll see errors if used on server)
  throw new Error('supabase() called on server – use server client instead')
  // OR return a dummy client if needed:
  // return { from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }) } as any
}