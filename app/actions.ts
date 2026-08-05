"use server";

import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  throw new Error("STRIPE_SECRET_KEY is not configured");
}

const stripe = new Stripe(stripeSecret, {
  apiVersion: "2026-02-25.clover",
});

const appUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

export type BountySessionErrorCode =
  | "MESSAGE_REQUIRED"
  | "MESSAGE_TOO_LONG"
  | "AMOUNT_INVALID"
  | "SESSION_URL_MISSING"
  | "STRIPE_ERROR";

export type BountySessionResult =
  | { status: "success"; url: string }
  | { status: "error"; code: BountySessionErrorCode; message?: string };

export async function createBountySession(
  amount: number,
  fanMessage: string
): Promise<BountySessionResult> {
  // Input validation and sanitization
  const normalizedMessage = fanMessage.trim();
  if (!normalizedMessage) {
    return { status: "error", code: "MESSAGE_REQUIRED" };
  }

  // Length limits to prevent abuse
  if (normalizedMessage.length > 500) {
    return { status: "error", code: "MESSAGE_TOO_LONG" };
  }

  // Amount validation with reasonable limits
  const normalizedAmount = Number.isFinite(amount)
    ? Math.max(Math.round(amount), 1)
    : 0;

  if (normalizedAmount <= 0 || normalizedAmount > 1000) { // Max $1000 bounty
    return { status: "error", code: "AMOUNT_INVALID" };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "GLST Bounty Request",
              description: normalizedMessage,
            },
            unit_amount: normalizedAmount * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/?success=true`,
      cancel_url: `${appUrl}/?canceled=true`,
      metadata: {
        fanMessage: normalizedMessage,
        amount: normalizedAmount.toString(),
      },
    });

    if (!session.url) {
      console.error("STRIPE_SESSION_ERROR", "Missing checkout URL", session.id);
      return { status: "error", code: "SESSION_URL_MISSING" };
    }

    return { status: "success", url: session.url };
  } catch (error) {
    const unknownError = error as { message?: string };
    console.error("STRIPE_SESSION_ERROR", error);
    return {
      status: "error",
      code: "STRIPE_ERROR",
      message: unknownError?.message,
    };
  }
}