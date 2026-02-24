
import { createClient } from '@supabase/supabase-js';

// For client-side (browser) usage – use NEXT_PUBLIC_ vars
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Optional: Add safety checks (especially useful during dev/deploy)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error(
    'Missing Supabase env vars!\n' +
    'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (local) or Vercel dashboard (prod).'
  );
}