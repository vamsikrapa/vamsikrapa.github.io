import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyRequest } from '@/lib/auth'

// POST /api/items - create new item under a category
export async function POST(request: Request) {
    const session = await verifyRequest(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { categoryId, name } = await request.json()
    if (!categoryId || !name?.trim()) {
        return NextResponse.json({ error: 'categoryId and name required' }, { status: 400 })
    }

    const orderResult = await sql`
    SELECT COALESCE(MAX(display_order), -1) as max_order FROM items WHERE category_id = ${categoryId}
  `
    const nextOrder = Number(orderResult[0].max_order) + 1

    const result = await sql`
    INSERT INTO items (category_id, name, display_order)
    VALUES (${categoryId}, ${name.trim()}, ${nextOrder})
    RETURNING id, category_id, name, display_order
  `
    return NextResponse.json({ item: result[0] }, { status: 201 })
}
