import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_dummy_key_to_pass_build', {
  // @ts-ignore
  apiVersion: '2023-10-16', // StripeのAPIバージョンを指定
  appInfo: {
    name: 'HHR KPI Manager',
    version: '0.1.0',
  },
});
