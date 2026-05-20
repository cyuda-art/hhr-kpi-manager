import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

// プランとPriceIDの簡易マッピング（実際は環境変数やStripeダッシュボードから取得します）
const PLAN_PRICE_MAP: Record<string, string> = {
  'STARTER': process.env.STRIPE_PRICE_ID_STARTER || 'price_starter_mock',
  'BUSINESS': process.env.STRIPE_PRICE_ID_BUSINESS || 'price_business_mock',
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orgId, planName, returnUrl } = body;

    if (!orgId || !planName) {
      return new NextResponse("Missing orgId or planName", { status: 400 });
    }

    const priceId = PLAN_PRICE_MAP[planName.toUpperCase()];
    if (!priceId) {
      return new NextResponse("Invalid plan name", { status: 400 });
    }

    // 組織情報の取得
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      return new NextResponse("Organization not found", { status: 404 });
    }

    // Stripeの環境変数が設定されていない場合（ローカル開発時のフォールバック）
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn("⚠️ STRIPE_SECRET_KEY is not set. Simulating successful checkout.");
      
      // モック動作として、DBを直接更新して成功ページへリダイレクトさせる
      await prisma.organization.update({
        where: { id: orgId },
        data: {
          subscriptionPlan: planName.toUpperCase(),
          stripeCustomerId: `cus_mock_${Math.random().toString(36).substring(7)}`,
          stripeSubscriptionId: `sub_mock_${Math.random().toString(36).substring(7)}`,
          stripePriceId: priceId,
          stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
        }
      });
      
      return NextResponse.json({ url: `${returnUrl}?success=true&mock=true` });
    }

    // Stripe Customerの作成または取得
    let customerId = organization.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: organization.name,
        metadata: {
          orgId: organization.id,
        },
      });
      customerId = customer.id;
      
      await prisma.organization.update({
        where: { id: orgId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Checkout セッションの作成
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: {
        orgId: organization.id,
        planName: planName.toUpperCase(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("[STRIPE_CHECKOUT_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
