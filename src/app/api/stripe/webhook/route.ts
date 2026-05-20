import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      // ローカル開発中でWebhook Secretがない場合はパースのみ行う（非セキュア）
      event = JSON.parse(body) as Stripe.Event;
    } else {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    }
  } catch (error: any) {
    console.error(`[WEBHOOK_ERROR] ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === 'checkout.session.completed') {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

      if (!session?.metadata?.orgId) {
        return new NextResponse("OrgId is missing in metadata", { status: 400 });
      }

      // 初回の決済成功：サブスクリプション情報をDBに保存
      await prisma.organization.update({
        where: {
          id: session.metadata.orgId,
        },
        data: {
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          subscriptionPlan: session.metadata.planName || 'FREE',
        },
      });
    }

    if (event.type === 'invoice.payment_succeeded') {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

      // サブスクリプション更新：次回の支払日をDBに更新
      await prisma.organization.update({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        data: {
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
    }
    
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      // サブスクリプション解約：DBのプランをFREEに戻す
      await prisma.organization.update({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        data: {
          subscriptionPlan: 'FREE',
          stripePriceId: null,
          // 期限切れで止まるようにする
        },
      });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error: any) {
    console.error("[STRIPE_WEBHOOK_HANDLER_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
