import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const {
      amountCents,
      djId,
      streamId,
      senderEmail,
      senderId,
      message,
      paymentType = 'tip',
      bountyTitle,
    } = await req.json();

    if (!amountCents || !djId) {
      return NextResponse.json({ error: 'Missing amount or DJ' }, { status: 400 });
    }

    // Get DJ's Stripe account
    const { data: djProfile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', djId)
      .single();

    if (!djProfile?.stripe_account_id) {
      return NextResponse.json({ error: 'DJ not set up for payments' }, { status: 400 });
    }

    // Platform fee (e.g., 15%)
    const platformFeeCents = Math.round(amountCents * 0.15);
    const djAmountCents = amountCents - platformFeeCents;

    // Create Stripe Payment Intent with transfer to DJ
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'gbp',
      automatic_payment_methods: { enabled: true },
      transfer_data: {
        destination: djProfile.stripe_account_id,
        amount: djAmountCents,
      },
      metadata: {
        dj_id: djId,
        stream_id: streamId || '',
        sender_id: senderId || '',
        payment_type: paymentType,
      },
    });

    // Record payment in database
    const { data: payment } = await supabase
      .from('payments')
      .insert({
        sender_id: senderId,
        sender_email: senderEmail,
        recipient_id: djId,
        stream_id: streamId,
        amount_cents: amountCents,
        currency: 'gbp',
        payment_type: paymentType,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending',
        message: message || null,
      })
      .select()
      .single();

    // If it's a bounty, create bounty record too
    if (paymentType === 'bounty' && bountyTitle) {
      await supabase.from('bounties').insert({
        fan_id: senderId,
        fan_email: senderEmail,
        dj_id: djId,
        stream_id: streamId,
        amount_cents: amountCents,
        title: bountyTitle,
        description: message,
        payment_id: payment?.id,
        stripe_payment_intent_id: paymentIntent.id,
      });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment?.id,
    });

  } catch (err: any) {
    console.error('[PAYMENT_ERROR]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
