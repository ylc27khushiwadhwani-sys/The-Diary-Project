// Razorpay webhook: the ONLY place a payment counts as successful.
// Deploy: `supabase functions deploy razorpay-webhook --no-verify-jwt`
// In the Razorpay dashboard add webhook https://<project>.supabase.co/functions/v1/razorpay-webhook
// for event `payment.captured`, with a secret saved as RAZORPAY_WEBHOOK_SECRET.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

Deno.serve(async (req) => {
  const body = await req.text();
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
  if (expected !== req.headers.get('x-razorpay-signature')) return new Response('bad signature', { status: 400 });

  const event = JSON.parse(body);
  if (event.event !== 'payment.captured') return new Response('ignored');
  const p = event.payload.payment.entity;
  const supa = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: pay } = await supa.from('payments').update({ status: 'captured', razorpay_payment_id: p.id }).eq('razorpay_order_id', p.order_id).select().single();
  if (!pay) return new Response('unknown order', { status: 404 });

  if (pay.purpose === 'letters' && pay.user_id) {
    await supa.from('letter_quota').upsert({ user_id: pay.user_id, paid: true, updated_at: new Date().toISOString() });
  }
  if (pay.purpose === 'community' && pay.email) {
    await supa.from('community_members').upsert({ email: pay.email, user_id: pay.user_id });
  }
  return new Response('ok');
});
