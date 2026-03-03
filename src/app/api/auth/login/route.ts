import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { signToken, COOKIE_OPTIONS } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json()

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
        }

        const result = await sql`
      SELECT id, username, role, password_hash FROM users WHERE username = ${username}
    `

        if (result.length === 0) {
            return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
        }

        const user = result[0]
        const passwordMatch = await bcrypt.compare(password, user.password_hash)

        if (!passwordMatch) {
            return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
        }

        const token = await signToken({ userId: user.id, username: user.username, role: user.role })

        const response = NextResponse.json({
            user: { id: user.id, username: user.username, role: user.role }
        })

        response.cookies.set(COOKIE_OPTIONS.name, token, {
            httpOnly: COOKIE_OPTIONS.httpOnly,
            secure: COOKIE_OPTIONS.secure,
            sameSite: COOKIE_OPTIONS.sameSite,
            maxAge: COOKIE_OPTIONS.maxAge,
            path: COOKIE_OPTIONS.path,
        })

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
