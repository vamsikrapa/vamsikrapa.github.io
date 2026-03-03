import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

const COOKIE_NAME = 'inventory_session'

export interface JWTPayload {
    userId: number
    username: string
    role: 'admin' | 'user'
}

export async function signToken(payload: JWTPayload): Promise<string> {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return payload as unknown as JWTPayload
    } catch {
        return null
    }
}

export async function getSession(): Promise<JWTPayload | null> {
    // Dynamic import to avoid issues in middleware context
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    return verifyToken(token)
}

export function getTokenFromRequest(request: Request): string | null {
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) return null
    const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
    return match ? match[1] : null
}

export async function verifyRequest(request: Request): Promise<JWTPayload | null> {
    const token = getTokenFromRequest(request)
    if (!token) return null
    return verifyToken(token)
}

export const COOKIE_OPTIONS = {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
}
