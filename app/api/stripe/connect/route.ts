import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

// Create Stripe Connected Account for DJ
export async function POST(req: NextRequest) {
  try {
    const { userId, email, displayName } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
    }

    // Check if DJ already has a Stripe account
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', userId)
      .single();

    let accountId = profile?.stripe_account_id;

    if (!accountId) {
      // Create new Stripe Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'GB',
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        individual: {
          first_name: displayName?.split(' ')[0] || undefined,
        },
        metadata: {
          user_id: userId,
          platform: 'guestlist',
        },
      });

      accountId = account.id;

      // Save Stripe account ID to profile
      await supabase.from('profiles').update({
        stripe_account_id: accountId,
        stripe_onboarding_complete: false,
      }).eq('id', userId);
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dj/onboarding?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dj/onboarding?success=true`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });

  } catch (err: any) {
    console.error('[STRIPE_CONNECT_ERROR]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
