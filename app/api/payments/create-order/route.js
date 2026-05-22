import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', receipt } = body;

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // If keys are not set, return mock order for testing UI
    if (!keyId || !keySecret || keyId.includes('XXXX')) {
      console.warn('Razorpay keys not configured — returning mock order');
      return NextResponse.json({
        orderId: 'order_mock_' + Date.now(),
        amount: Math.round(amount * 100),
        currency,
        mock: true,
      });
    }

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency,
        receipt: receipt || 'receipt_' + Date.now(),
      }),
    });

    const order = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: order.error?.description || 'Order creation failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });

  } catch (err) {
    console.error('paymentss route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}