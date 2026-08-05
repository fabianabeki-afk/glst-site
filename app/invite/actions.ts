"use client";

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize the client setup mapping out our DB layer types
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function acceptVanguardInvitation(userId: string, stageName: string) {
  try {
    // Update their profile row in the public schema table
    const { data, error } = await supabase
      .from('profiles')
      .update({
        tier: 'vanguard',
        is_invited: true,
        has_paid_premium: true, // Free lifetime access bypass
        platform_fee_split: 0.10, // Premium 10% platform cut for invited VIPs
        stage_name: stageName
      })
      .eq('id', userId)
      .select();

    if (error) {
      return { status: 'error', message: error.message };
    }

    return { status: 'success', data };
  } catch (err: any) {
    return { status: 'error', message: err.message || 'TRANSACTION_EXCEPTION' };
  }
}