// utils/chat.ts
'use client';

import { createClient } from '@/lib/supabase/client';

const SINGLE_ADMIN_ID = process.env.NEXT_PUBLIC_SINGLE_ADMIN_ID || '6dcd8ac2-6734-4eee-a9ce-ddee18628b1d'; // ← replace with real UUID

/**
 * Get existing conversation or create a new one between current user and the single admin
 * @param currentUserId - UUID of the logged-in artisan/customer
 * @param jobId - Optional job ID to tie the conversation to
 * @returns conversation ID
 */
export async function getOrCreateConversation(
  currentUserId: string,
  jobId?: string | null
): Promise<string> {
  const supabase = createClient();

  // Normalize participant order to avoid duplicate rows
  const [p1, p2] = [currentUserId, SINGLE_ADMIN_ID].sort();

  let query = supabase
    .from('conversations')
    .select('id')
    .eq('participant1_id', p1)
    .eq('participant2_id', p2);

  if (jobId) {
    query = query.eq('job_id', jobId);
  } else {
    query = query.is('job_id', null);
  }

  const { data: existing, error: lookupError } = await query.maybeSingle();

  if (lookupError && lookupError.code !== 'PGRST116') { // not "no rows found"
    throw lookupError;
  }

  if (existing?.id) {
    return existing.id;
  }

  // Create new conversation
  const { data: newConv, error: insertError } = await supabase
    .from('conversations')
    .insert({
      participant1_id: p1,
      participant2_id: p2,
      job_id: jobId || null,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Create conversation failed:', insertError);
    throw insertError;
  }

  if (!newConv?.id) {
    throw new Error('Failed to create conversation – no ID returned');
  }

  return newConv.id;
}