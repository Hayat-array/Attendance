'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ teacher_id: '', password: '', remember: false });
    const [showPwd, setShowPwd] = useState(false);
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('sa_theme') || 'dark';
        document.documentElement.dataset.theme = saved;
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        const res = await signIn('credentials', {
            teacher_id: form.teacher_id,
            password: form.password,
            redirect: false,
        });
        setLoading(false);
        if (res?.ok) { router.push('/dashboard'); router.refresh(); }
        else setMsg({ type: 'error', text: 'Invalid Teacher ID or Password.' });
    }

    function toggleTheme() {
        const cur = document.documentElement.dataset.theme;
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        localStorage.setItem('sa_theme', next);
    }

    return (
        <>
            <button className="theme-toggle" style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }} onClick={toggleTheme} aria-label="Toggle theme">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            </button>

            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', position: 'relative', zIndex: 1 }}>
                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, var(--accent), #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 30px var(--accent-glow)' }}>
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" style={{ width: 30, height: 30, color: '#fff' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>JECRC Attendance App</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 5 }}>College Management Portal</div>
                </div>

                {/* Card */}
                <div className="card" style={{ width: '100%', maxWidth: 440, borderRadius: 20, overflow: 'hidden', animation: 'slideDown 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                    <div style={{ height: 3, background: 'linear-gradient(90deg, var(--accent), #1d4ed8, transparent)' }} />
                    <div style={{ padding: '32px' }}>
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent-lite)', border: '1px solid var(--info-bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, color: 'var(--accent)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                                </div>
                                Sign In to Your Account
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8, lineHeight: 1.6 }}>Enter your Teacher ID and password to access the portal.</p>
                        </div>

                        {msg && (
                            <div className={`flash ${msg.type}`} style={{ marginBottom: 20 }}>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {msg.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="field-group">
                                <label className="field-label">Teacher ID</label>
                                <div className="input-wrap">
                                    <span className="input-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" /></svg></span>
                                    <input type="text" className="input-with-icon" placeholder="e.g. T001" required value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} autoComplete="username" />
                                </div>
                            </div>

                            <div className="field-group">
                                <label className="field-label">Password</label>
                                <div className="input-wrap">
                                    <span className="input-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></span>
                                    <input type={showPwd ? 'text' : 'password'} className="input-with-icon" placeholder="Enter your password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} autoComplete="current-password" style={{ paddingRight: 40 }} />
                                    <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex' }}>
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}><path strokeLinecap="round" strokeLinejoin="round" d={showPwd ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} /></svg>
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text2)', fontWeight: 500, userSelect: 'none' }}>
                                    <input type="checkbox" checked={form.remember} onChange={e => setForm({ ...form, remember: e.target.checked })} style={{ width: 17, height: 17 }} />
                                    Remember me
                                </label>
                                <Link href="/forgot-password" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Forgot Password?</Link>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15, borderRadius: 11 }} disabled={loading}>
                                {loading ? 'Signing in…' : 'Sign In'}
                            </button>
                        </form>


                        <div style={{ height: 1, background: 'var(--border)', margin: '22px 0' }} />
                        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
                            New teacher?&nbsp;<Link href="/signup" style={{ fontWeight: 700, color: 'var(--accent)' }}>Create Account →</Link>
                        </div>
                    </div>
                </div>
                <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 22, opacity: 0.7 }}>
                    Smart Attendance © 2026 — College Management Portal
                    <br />
                    <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, marginTop: 4, display: 'block' }}>Created by Hayat Ali</span>
                </p>
            </div>
        </>
    );
}
