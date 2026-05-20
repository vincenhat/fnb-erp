import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { db } from '@/server/db';

/**
 * Clerk webhook: keep our `users` table in sync with Clerk's user lifecycle.
 *
 * Configure in Clerk dashboard → Webhooks → add endpoint
 *   https://<your-domain>/api/webhooks/clerk
 * with events `user.created`, `user.updated`, `user.deleted`.
 *
 * Set CLERK_WEBHOOK_SECRET to the signing secret shown in the Clerk dashboard.
 */
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CLERK_WEBHOOK_SECRET not configured' }, { status: 501 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const body = await req.text();
  let evt: ClerkWebhookEvent;
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error('[clerk-webhook] verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  switch (evt.type) {
    case 'user.created':
    case 'user.updated': {
      const u = evt.data;
      const email = u.email_addresses[0]?.email_address;
      if (!email || !u.id) break;
      await db.user.upsert({
        where: { clerkId: u.id },
        create: {
          clerkId: u.id,
          email,
          fullName: [u.first_name, u.last_name].filter(Boolean).join(' ') || null,
          imageUrl: u.image_url ?? null,
        },
        update: {
          email,
          fullName: [u.first_name, u.last_name].filter(Boolean).join(' ') || null,
          imageUrl: u.image_url ?? null,
        },
      });
      break;
    }
    case 'user.deleted': {
      if (!evt.data.id) break;
      await db.user.delete({ where: { clerkId: evt.data.id } }).catch(() => undefined);
      break;
    }
  }

  return NextResponse.json({ ok: true });
}

// Minimal local typing so we don't pull in `@clerk/backend` just for this.
interface ClerkWebhookEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted' | (string & {});
  data: {
    id?: string;
    email_addresses: { email_address: string }[];
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
  };
}
