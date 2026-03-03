import { NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/auth'

export async function GET(request: Request) {
    const session = await verifyRequest(request)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({
        user: { id: session.userId, username: session.username, role: session.role }
    })
}
