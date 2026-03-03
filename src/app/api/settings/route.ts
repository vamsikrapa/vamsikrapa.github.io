import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyRequest } from '@/lib/auth'

// GET /api/settings
export async function GET(request: Request) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await sql`SELECT key, value FROM settings`
  const result: Record<string, string> = {}
  settings.forEach(s => {
    result[s.key] = s.value
  })

  const restaurantId = Number(process.env.DEFAULT_RESTAURANT_ID || 1)
  const restaurantResult = await sql`
    SELECT id, name FROM restaurants WHERE id = ${restaurantId}
  `
  const restaurant = restaurantResult[0] || { id: restaurantId, name: 'My Restaurant' }

  return NextResponse.json({ settings: result, restaurant })
}

// PUT /api/settings - update restaurant name or app settings (admin only)
export async function PUT(request: Request) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { restaurantName, appName } = await request.json()

  if (restaurantName) {
    const restaurantId = Number(process.env.DEFAULT_RESTAURANT_ID || 1)
    await sql`
      UPDATE restaurants SET name = ${restaurantName} WHERE id = ${restaurantId}
    `
  }

  if (appName) {
    await sql`
      INSERT INTO settings (key, value, updated_at)
      VALUES ('app_name', ${appName}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `
  }

  return NextResponse.json({ success: true })
}
