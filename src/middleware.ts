import { NextResponse } from 'next/server'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Public paths that don't require auth
    const publicPaths = ['/login', '/signup', '/api/auth/login', '/api/auth/register']
    if (publicPaths.some(p => pathname.startsWith(p))) {
        return NextResponse.next()
    }

    // Check for auth token
    const token = getTokenFromRequest(request)
    if (!token) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', request.url))
    }

    const payload = await verifyToken(token)
    if (!payload) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Admin-only API routes
    const adminOnlyPaths = [
        '/api/categories',
        '/api/items',
        '/api/settings',
    ]
    const isAdminOnly = adminOnlyPaths.some(p => pathname.startsWith(p))
    const isWriteMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)

    if (isAdminOnly && isWriteMethod && payload.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 })
    }

    // Add user info to headers for use in route handlers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', String(payload.userId))
    requestHeaders.set('x-username', payload.username)
    requestHeaders.set('x-user-role', payload.role)

    return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
