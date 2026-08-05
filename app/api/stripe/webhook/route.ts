import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update payment status
        await supabase
          .from('payments')
          .update({
            status: 'completed',
            stripe_transfer_id: paymentIntent.transfer_data?.destination?.toString(),
            completed_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        // Update bounty status if applicable
        await supabase
          .from('bounties')
          .update({ status: 'open' })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        
        // Update DJ's onboarding status
        if (account.details_submitted) {
          await supabase
            .from('profiles')
            .update({ stripe_onboarding_complete: true })
            .eq('stripe_account_id', account.id);
        }

        break;
      }
    }

    return NextResponse.json({ received: true });

  } catch (err: any) {
    console.error('[WEBHOOK_ERROR]:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
