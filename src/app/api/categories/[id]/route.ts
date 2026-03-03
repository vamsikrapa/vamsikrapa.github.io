import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyRequest } from '@/lib/auth'

// PUT /api/categories/[id] - rename category
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { name } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const result = await sql`
    UPDATE categories SET name = ${name.trim()}
    WHERE id = ${id}
    RETURNING id, name, display_order
  `
  if (result.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ category: result[0] })
}

// DELETE /api/categories/[id] - delete category and all its items
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await sql`DELETE FROM categories WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
