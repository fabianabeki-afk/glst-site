'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface TipButtonProps {
  djId: string;
  djName: string;
  streamId?: string;
  userEmail?: string;
  userId?: string;
}

export default function TipButton({ djId, djName, streamId, userEmail, userId }: TipButtonProps) {
  const [amount, setAmount] = useState(500); // £5.00 default
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const presetAmounts = [200, 500, 1000, 2000]; // £2, £5, £10, £20

  const handleTip = async () => {
    if (!amount || amount < 50) return;
    setLoading(true);

    try {
      const res = await fetch('/api/stripe/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents: amount,
          djId,
          streamId,
          senderEmail: userEmail,
          senderId: userId,
          message,
          paymentType: 'tip',
        }),
      });

      const { clientSecret } = await res.json();

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe not loaded');

      const { error } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/tip/success`,
        },
      });

      if (error) {
        alert(error.message);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="px-4 py-2 bg-[#D4AF37] text-black text-xs font-black tracking-widest rounded-lg hover:bg-[#AA8417] transition-colors"
      >
        💰 TIP DJ
      </button>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
      <div className="text-xs font-black tracking-widest text-[#D4AF37] uppercase">SEND TIP TO {djName.toUpperCase()}</div>
      
      <div className="flex gap-2">
        {presetAmounts.map((amt) => (
          <button
            key={amt}
            onClick={() => setAmount(amt)}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition-colors ${
              amount === amt
                ? 'bg-[#D4AF37] text-black'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            £{(amt / 100).toFixed(2)}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Add a message... (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#D4AF37]"
      />

      <div className="flex gap-2">
        <button
          onClick={() => setShowForm(false)}
          className="flex-1 py-2 bg-neutral-800 text-neutral-400 text-xs font-black rounded-lg hover:text-white transition-colors"
        >
          CANCEL
        </button>
        <button
          onClick={handleTip}
          disabled={loading}
          className="flex-1 py-2 bg-[#D4AF37] text-black text-xs font-black rounded-lg hover:bg-[#AA8417] transition-colors disabled:opacity-50"
        >
          {loading ? '...' : `SEND £${(amount / 100).toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
