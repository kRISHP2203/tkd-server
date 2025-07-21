
'use server';

import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import shortid from 'shortid';
import { verifyLicense, updateLicenseOnPayment } from '@/lib/auth-service';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  const { amount, plan, deviceId } = await req.json();

  if (!amount || !plan || !deviceId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const payment_capture = 1;
  const currency = 'INR';
  const options = {
    amount: (amount * 100).toString(),
    currency,
    receipt: shortid.generate(),
    payment_capture,
    notes: {
        plan: plan,
        deviceId: deviceId
    }
  };

  try {
    const response = await razorpay.orders.create(options);
    return NextResponse.json({
      id: response.id,
      currency: response.currency,
      amount: response.amount,
    });
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
    const { orderId, paymentId, signature, plan, deviceId } = await req.json();

    if (!orderId || !paymentId || !signature || !plan || !deviceId) {
        return NextResponse.json({ error: 'Missing required fields for verification' }, { status: 400 });
    }

    try {
        const generated_signature = require('crypto')
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(orderId + "|" + paymentId)
            .digest('hex');

        if (generated_signature !== signature) {
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        const newLicenseKey = await updateLicenseOnPayment(plan, deviceId);

        if (!newLicenseKey) {
            throw new Error('Failed to create or update license after payment.');
        }
        
        console.log(`✅ Payment verified. New license key ${newLicenseKey} created for plan ${plan}.`);

        return NextResponse.json({ success: true, licenseKey: newLicenseKey, plan: plan });

    } catch (error) {
        console.error('Payment verification failed:', error);
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
    }
}
