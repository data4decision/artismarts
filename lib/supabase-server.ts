// lib/supabase-server.ts
'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()  // ← await it (returns Promise<ReadonlyRequestCookies>)

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return (await cookieStore).getAll()  // ← await again inside async getter
        },

        async setAll(cookiesToSet) {
          try {
            const store = await cookieStore
            cookiesToSet.forEach(({ name, value, options }) => {
              store.set(name, value, options)
            })
          } catch (err) {
            // Safe to ignore in client contexts or build-time
            console.warn('Cookie set failed (likely build-time or client call):', err)
          }
        },
      },
    }
  )
}