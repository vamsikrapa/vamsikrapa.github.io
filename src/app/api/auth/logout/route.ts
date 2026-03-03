import { NextResponse } from 'next/server'
import { COOKIE_OPTIONS } from '@/lib/auth'

export async function POST() {
    const response = NextResponse.json({ success: true })
    response.cookies.set(COOKIE_OPTIONS.name, '', {
        httpOnly: COOKIE_OPTIONS.httpOnly,
        secure: COOKIE_OPTIONS.secure,
        sameSite: COOKIE_OPTIONS.sameSite,
        maxAge: 0,
        path: COOKIE_OPTIONS.path,
    })
    return response
}
