// app/api/paystack/initiate-payment/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('Paystack route HIT at:', new Date().toISOString());

  try {
    const body = await request.json();
    console.log('Request body:', body);

    const {
      amount,
      email,
      phone_number = '',
      fullname = '',
      tx_ref,
      currency = 'NGN',
      redirect_url,
      meta = {}
    } = body;

    if (!amount || !email || !tx_ref || !redirect_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Paystack expects amount in **kobo** (Naira × 100)
    const amountInKobo = Math.round(Number(amount) * 100);

    const payload = {
      reference: tx_ref,
      amount: amountInKobo,
      currency,
      email,
      callback_url: redirect_url,
      metadata: {
        ...meta,
        phone_number,
        fullname,
        custom_fields: [
          {
            display_name: "Phone Number",
            variable_name: "phone_number",
            value: phone_number
          }
        ]
      }
    };

    console.log('Paystack payload prepared. Key exists?', !!process.env.PAYSTACK_SECRET_KEY);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY || ''}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const text = await response.text();

      console.log('Paystack response status:', response.status);
      console.log('Paystack response preview:', text.substring(0, 500));

      if (!response.ok) {
        return NextResponse.json(
          { error: `Paystack error ${response.status}: ${text.slice(0, 200)}` },
          { status: response.status }
        );
      }

      const data = JSON.parse(text);

      if (!data.status) {
        return NextResponse.json({ error: data.message || 'Paystack failed' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        paymentLink: data.data.authorization_url
      });

    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      console.error('Paystack fetch error:', fetchErr.name, fetchErr.message);
      if (fetchErr.name === 'AbortError') {
        return NextResponse.json({ error: 'Paystack timeout' }, { status: 504 });
      }
      return NextResponse.json({ error: 'Failed to reach Paystack' }, { status: 500 });
    }

  } catch (err: any) {
    console.error('Route error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}