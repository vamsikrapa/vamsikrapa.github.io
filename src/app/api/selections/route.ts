import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyRequest } from '@/lib/auth'

// GET /api/selections - get all selections for current user
export async function GET(request: Request) {
    const session = await verifyRequest(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const selections = await sql`
    SELECT item_id, status FROM selections WHERE user_id = ${session.userId}
  `
    const selectionMap: Record<number, string> = {}
    selections.forEach(s => {
        selectionMap[s.item_id] = s.status
    })

    return NextResponse.json({ selections: selectionMap })
}

// POST /api/selections - batch save selections for current user
export async function POST(request: Request) {
    const session = await verifyRequest(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { selections } = await request.json()
    if (!selections || typeof selections !== 'object') {
        return NextResponse.json({ error: 'Invalid selections payload' }, { status: 400 })
    }

    const entries = Object.entries(selections) as [string, string | null][]

    for (const [itemId, status] of entries) {
        if (status === null || status === '') {
            await sql`
        DELETE FROM selections WHERE user_id = ${session.userId} AND item_id = ${Number(itemId)}
      `
        } else {
            await sql`
        INSERT INTO selections (user_id, item_id, status, updated_at)
        VALUES (${session.userId}, ${Number(itemId)}, ${status}, NOW())
        ON CONFLICT (user_id, item_id)
        DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
      `
        }
    }

    return NextResponse.json({ success: true })
}
