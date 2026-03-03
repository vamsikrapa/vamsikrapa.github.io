import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyRequest } from '@/lib/auth'

// PUT /api/items/[id] - rename item
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { name } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const result = await sql`
    UPDATE items SET name = ${name.trim()}
    WHERE id = ${id}
    RETURNING id, category_id, name, display_order
  `
  if (result.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ item: result[0] })
}

// DELETE /api/items/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await sql`DELETE FROM items WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
