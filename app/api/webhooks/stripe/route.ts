import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { postChatMessage } from '@/lib/chat';

export async function POST(request: NextRequest) {
  try {
    // 1. Initialize Stripe only when the request actually happens
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: '2026-02-25.clover',
    });

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    // 2. Process the request
    const body = await request.text();
    const headersList = await headers();
    const sigHeader = headersList.get('stripe-signature');

    if (!sigHeader || typeof sigHeader !== 'string') {
      console.error('Stripe webhook: Missing or invalid signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sigHeader, webhookSecret);
    } catch (err: any) {
      console.error('Stripe webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 3. Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        
        try {
          await postChatMessage({
            user: 'system',
            text: `BOUNTY_RECEIVED ${session.amount_total} cents - "${session.metadata?.fanMessage || ''}"`,
            time: new Date().toISOString(),
          });
        } catch (err) {
          console.error('Failed to post bounty to chat:', err);
        }
        break;

      case 'payment_intent.payment_failed':
        console.log('Payment failed:', (event.data.object as Stripe.PaymentIntent).id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}