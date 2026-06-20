import { sendPushToMany } from '@lynkko/push'
import { db } from '@/lib/db'
import { pushSubscriptions } from '@/lib/db/schema'
import { eq, inArray } from '@lynkko/db'

interface PushPayload {
  title: string
  body:  string
  url?:  string
  tag?:  string
}

export async function notifyUser(userId: string, payload: PushPayload) {
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))

  const results = await sendPushToMany(subs, payload)
  await cleanExpired(results)
}

export async function notifyBrand(brandId: string, payload: PushPayload) {
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.brandId, brandId))

  const results = await sendPushToMany(subs, payload)
  await cleanExpired(results)
}

async function cleanExpired(results: Awaited<ReturnType<typeof sendPushToMany>>) {
  const expired = results.filter(r => r.expired).map(r => r.endpoint)
  if (expired.length > 0) {
    await db.delete(pushSubscriptions)
      .where(inArray(pushSubscriptions.endpoint, expired))
  }
}
