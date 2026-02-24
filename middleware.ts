// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // 1. Get these from your .env.local (or .env) file
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 2. Safety check (very useful during development)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase URL or Anon Key in environment variables')
    return NextResponse.next() // or redirect to error page
  }

  // 3. Create client correctly
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name) => req.cookies.get(name)?.value,
      set: (name, value, options) => {
        res.cookies.set({ name, value, ...options })
      },
      remove: (name, options) => {
        res.cookies.delete({ name, ...options })
      },
    },
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect /admin/* routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      // Redirect to your admin login page (adjust path if needed)
      return NextResponse.redirect(new URL('/admin/admin-login', req.url))
    }

    // Optional: check role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*'],
}