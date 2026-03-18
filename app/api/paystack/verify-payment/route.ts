// app/api/paystack/verify-payment/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')

  console.log('[VERIFY ENDPOINT] Called with reference:', reference)

  if (!reference) {
    console.warn('[VERIFY ENDPOINT] Missing reference param')
    return NextResponse.json({ error: 'Missing reference parameter' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Cache-Control': 'no-cache'
      }
    })

    const text = await res.text()
    console.log('[VERIFY ENDPOINT] Paystack status:', res.status)
    console.log('[VERIFY ENDPOINT] Paystack response preview:', text.substring(0, 500))

    if (!res.ok) {
      return NextResponse.json(
        { error: `Paystack verify failed: ${res.status} - ${text.slice(0, 200)}` },
        { status: res.status }
      )
    }

    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      console.error('[VERIFY ENDPOINT] Invalid JSON from Paystack:', text)
      return NextResponse.json({ error: 'Invalid response from Paystack' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[VERIFY ENDPOINT] Fetch error:', err.message)
    return NextResponse.json({ error: 'Failed to verify with Paystack' }, { status: 500 })
  }
}