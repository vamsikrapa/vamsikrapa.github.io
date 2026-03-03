import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyRequest } from '@/lib/auth'

const DEFAULT_RESTAURANT_ID = Number(process.env.DEFAULT_RESTAURANT_ID || 1)

// GET /api/categories - get all categories with items
export async function GET(request: Request) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const restaurantId = DEFAULT_RESTAURANT_ID

  const categories = await sql`
    SELECT id, name, display_order FROM categories
    WHERE restaurant_id = ${restaurantId}
    ORDER BY display_order ASC, created_at ASC
  `

  const items = await sql`
    SELECT i.id, i.category_id, i.name, i.display_order
    FROM items i
    JOIN categories c ON i.category_id = c.id
    WHERE c.restaurant_id = ${restaurantId}
    ORDER BY i.display_order ASC, i.created_at ASC
  `

  const categoriesWithItems = categories.map(cat => ({
    ...cat,
    items: items.filter(item => item.category_id === cat.id),
  }))

  return NextResponse.json({ categories: categoriesWithItems })
}

// POST /api/categories - create new category (admin only)
export async function POST(request: Request) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const restaurantId = DEFAULT_RESTAURANT_ID

  // Get max order
  const orderResult = await sql`
    SELECT COALESCE(MAX(display_order), -1) as max_order FROM categories WHERE restaurant_id = ${restaurantId}
  `
  const nextOrder = Number(orderResult[0].max_order) + 1

  const result = await sql`
    INSERT INTO categories (restaurant_id, name, display_order)
    VALUES (${restaurantId}, ${name.trim()}, ${nextOrder})
    RETURNING id, name, display_order
  `
  return NextResponse.json({ category: { ...result[0], items: [] } }, { status: 201 })
}
