import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orgId, returnUrl } = body;

    if (!orgId) {
      return new NextResponse("Missing orgId", { status: 400 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization || !organization.stripeCustomerId) {
      return new NextResponse("Organization or Customer not found", { status: 404 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      // ローカル開発用モック
      console.warn("⚠️ STRIPE_SECRET_KEY is not set. Returning mock portal url.");
      return NextResponse.json({ url: `${returnUrl}?portal=mock` });
    }

    const stripeSession = await stripe.billingPortal.sessions.create({
      customer: organization.stripeCustomerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error: any) {
    console.error("[STRIPE_PORTAL_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
