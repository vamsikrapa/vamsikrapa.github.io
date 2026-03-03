import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { signToken, COOKIE_OPTIONS } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const { username, password, role } = await request.json()

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
        }
        if (username.length < 3 || username.length > 50) {
            return NextResponse.json({ error: 'Username must be 3–50 characters' }, { status: 400 })
        }
        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
        }

        // Check if username taken
        const existing = await sql`SELECT id FROM users WHERE username = ${username}`
        if (existing.length > 0) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
        }

        // Check how many users exist (first user becomes admin)
        const countResult = await sql`SELECT COUNT(*) as count FROM users`
        const isFirstUser = Number(countResult[0].count) === 0
        const userRole = isFirstUser ? 'admin' : (role === 'admin' ? 'admin' : 'user')

        const passwordHash = await bcrypt.hash(password, 12)

        const result = await sql`
      INSERT INTO users (username, password_hash, role)
      VALUES (${username}, ${passwordHash}, ${userRole})
      RETURNING id, username, role
    `
        const user = result[0]

        const token = await signToken({ userId: user.id, username: user.username, role: user.role })

        const response = NextResponse.json({
            user: { id: user.id, username: user.username, role: user.role }
        }, { status: 201 })

        response.cookies.set(COOKIE_OPTIONS.name, token, {
            httpOnly: COOKIE_OPTIONS.httpOnly,
            secure: COOKIE_OPTIONS.secure,
            sameSite: COOKIE_OPTIONS.sameSite,
            maxAge: COOKIE_OPTIONS.maxAge,
            path: COOKIE_OPTIONS.path,
        })

        return response
    } catch (error) {
        console.error('Register error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
