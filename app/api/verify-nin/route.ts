// app/api/verify-nin/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { nin, first_name, last_name } = await req.json();

    if (!nin || nin.length !== 11 || !/^\d{11}$/.test(nin)) {
      return NextResponse.json({ valid: false, message: 'Invalid NIN format' }, { status: 400 });
    }

    // Example using Korapay (replace with your provider)
    const response = await fetch('https://api.korapay.com/merchant/api/v1/identities/ng/nin', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.KORAPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: nin,
        // Optional: add first_name, last_name, dob for data matching
      }),
    });

    const result = await response.json();

    if (result.status === true) {
      return NextResponse.json({
        valid: true,
        message: 'NIN verified successfully',
        data: result.data, // contains name, dob, etc. if available
      });
    }

    return NextResponse.json({
      valid: false,
      message: result.message || 'NIN verification failed',
    });

  } catch (error) {
    console.error('NIN verification error:', error);
    return NextResponse.json({ valid: false, message: 'Verification service unavailable' }, { status: 500 });
  }
}