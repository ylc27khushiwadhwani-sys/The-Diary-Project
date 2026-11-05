// Creates a Razorpay order for the site. Deploy: `supabase functions deploy razorpay-order`
// Secrets needed: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (set with `supabase secrets set`).
// Prices live here, server side, so a visitor can never choose their own amount.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const PRICES_PAISE: Record<string, number> = {
  letters: Number(Deno.env.get('PRICE_LETTERS_PAISE') ?? 19900),     // owner to confirm
  community: Number(Deno.env.get('PRICE_COMMUNITY_PAISE') ?? 14900), // owner to confirm
};
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const { purpose, email } = await req.json();
  const amount = PRICES_PAISE[purpose];
  if (!amount) return new Response(JSON.stringify({ error: 'unknown purpose' }), { status: 400, headers: cors });

  const supa = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  let userId: string | null = null;
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (token) userId = (await supa.auth.getUser(token)).data.user?.id ?? null;
  if (purpose === 'letters' && !userId) return new Response(JSON.stringify({ error: 'sign in first' }), { status: 401, headers: cors });
  if (purpose === 'community' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email ?? '')) return new Response(JSON.stringify({ error: 'valid email required' }), { status: 400, headers: cors });

  const auth = btoa(`${Deno.env.get('RAZORPAY_KEY_ID')}:${Deno.env.get('RAZORPAY_KEY_SECRET')}`);
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency: 'INR', notes: { purpose, user_id: userId ?? '', email: email ?? '' } }),
  });
  const order = await res.json();
  if (!res.ok) return new Response(JSON.stringify({ error: 'razorpay error' }), { status: 502, headers: cors });

  await supa.from('payments').insert({ purpose, user_id: userId, email: email ?? null, razorpay_order_id: order.id, amount_paise: amount });
  return new Response(JSON.stringify({ order_id: order.id, amount, currency: 'INR', key_id: Deno.env.get('RAZORPAY_KEY_ID') }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
