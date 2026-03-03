'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (password !== confirm) {
            setError('Passwords do not match')
            return
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Registration failed')
            } else {
                router.push('/dashboard')
            }
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-bg">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">📦</div>
                    <span className="auth-logo-text">Inventory Manager</span>
                </div>

                <h1 className="auth-title">Create account</h1>
                <p className="auth-subtitle">No email needed — just a username and password</p>

                {error && <div className="form-error" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} id="signup-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-username">Username</label>
                        <input
                            id="signup-username"
                            className="form-input"
                            type="text"
                            placeholder="Choose a username (3–50 chars)"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                            minLength={3}
                            maxLength={50}
                            autoFocus
                            autoComplete="username"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-password">Password</label>
                        <input
                            id="signup-password"
                            className="form-input"
                            type="password"
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-confirm">Confirm Password</label>
                        <input
                            id="signup-confirm"
                            className="form-input"
                            type="password"
                            placeholder="Repeat your password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>
                    <button
                        id="signup-submit"
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? <span className="spinner" /> : null}
                        {loading ? 'Creating account…' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-link-row">
                    Already have an account?{' '}
                    <Link href="/login" className="auth-link" id="go-to-login">Sign in</Link>
                </div>
            </div>
        </div>
    )
}
