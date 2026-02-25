'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1=email, 2=reset
    const [email, setEmail] = useState('');
    const [form, setForm] = useState({ otp: ['', '', '', '', '', ''], password: '', confirm_password: '' });
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('sa_theme') || 'dark';
        document.documentElement.dataset.theme = saved;
    }, []);

    function toggleTheme() {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        localStorage.setItem('sa_theme', next);
    }

    async function sendOtp(e) {
        e.preventDefault();
        setMsg(null); setLoading(true);
        const res = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        const data = await res.json();
        setLoading(false);
        setMsg({ type: 'info', text: data.message || 'OTP sent if account exists.' });
        if (res.ok) setStep(2);
    }

    function handleOtpKey(idx, e) {
        const val = e.target.value.replace(/\D/g, '');
        if (!val && e.nativeEvent.inputType !== 'deleteContentBackward') return;
        const next = [...form.otp];
        if (val) {
            next[idx] = val[val.length - 1];
            setForm(f => ({ ...f, otp: next }));
            if (idx < 5) document.getElementById(`fp-otp-${idx + 1}`)?.focus();
        } else {
            next[idx] = '';
            setForm(f => ({ ...f, otp: next }));
        }
    }
    function handleOtpKeyDown(idx, e) {
        if (e.key === 'Backspace' && !form.otp[idx] && idx > 0)
            document.getElementById(`fp-otp-${idx - 1}`)?.focus();
    }
    function handleOtpPaste(e) {
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!text) return;
        e.preventDefault();
        const next = [...form.otp];
        text.split('').forEach((c, i) => { next[i] = c; });
        setForm(f => ({ ...f, otp: next }));
        document.getElementById(`fp-otp-${Math.min(text.length, 5)}`)?.focus();
    }

    async function resetPassword(e) {
        e.preventDefault();
        const otpStr = form.otp.join('');
        if (otpStr.length < 6) return setMsg({ type: 'error', text: 'Please enter all 6 OTP digits.' });
        if (form.password !== form.confirm_password) return setMsg({ type: 'error', text: 'Passwords do not match.' });
        if (form.password.length < 6) return setMsg({ type: 'error', text: 'Password must be ≥6 chars.' });
        setMsg(null); setLoading(true);
        const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp: otpStr, password: form.password, confirm_password: form.confirm_password }) });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) return setMsg({ type: 'error', text: data.error });
        setMsg({ type: 'success', text: data.message });
        setTimeout(() => router.push('/login'), 1500);
    }

    return (
        <>
            <button className="theme-toggle" style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }} onClick={toggleTheme}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            </button>
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, var(--accent), #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 30px var(--accent-glow)' }}>
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" style={{ width: 30, height: 30, color: '#fff' }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>Smart Attendance</div>
                </div>

                <div className="card" style={{ width: '100%', maxWidth: 440, borderRadius: 20, overflow: 'hidden', animation: 'slideDown 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                    <div style={{ height: 3, background: 'linear-gradient(90deg, var(--accent), #1d4ed8, transparent)' }} />
                    <div style={{ padding: '32px' }}>
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)' }}>{step === 1 ? 'Forgot Password' : 'Reset Password'}</div>
                            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8 }}>
                                {step === 1 ? 'Enter your registered email to receive an OTP.' : 'Enter the OTP and your new password.'}
                            </p>
                        </div>

                        {msg && (
                            <div className={`flash ${msg.type}`} style={{ marginBottom: 20 }}>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {msg.text}
                            </div>
                        )}

                        {step === 1 ? (
                            <form onSubmit={sendOtp}>
                                <div className="field-group">
                                    <label className="field-label">Email Address</label>
                                    <input type="email" placeholder="teacher@college.edu" required value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15 }} disabled={loading}>
                                    {loading ? 'Sending…' : 'Send OTP →'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={resetPassword}>
                                <div className="field-group">
                                    <label className="field-label" style={{ textAlign: 'center', display: 'block' }}>OTP Code</label>
                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 4 }} onPaste={handleOtpPaste}>
                                        {form.otp.map((d, i) => (
                                            <input
                                                key={i}
                                                id={`fp-otp-${i}`}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={d}
                                                onChange={e => handleOtpKey(i, e)}
                                                onKeyDown={e => handleOtpKeyDown(i, e)}
                                                style={{ width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', borderRadius: 12, border: d ? '2px solid var(--accent)' : '1px solid var(--border)', background: d ? 'var(--accent-lite)' : 'var(--input-bg)', color: 'var(--text)', transition: 'border-color 0.15s, background 0.15s', caretColor: 'var(--accent)' }}
                                            />
                                        ))}
                                    </div>
                                    <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>Check your email inbox (and spam folder)</p>
                                </div>
                                <div className="field-group">
                                    <label className="field-label">New Password</label>
                                    <input type="password" placeholder="Min. 6 characters" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                                </div>
                                <div className="field-group">
                                    <label className="field-label">Confirm Password</label>
                                    <input type="password" placeholder="Repeat password" required value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15 }} disabled={loading || form.otp.join('').length < 6}>
                                    {loading ? 'Updating…' : 'Reset Password'}
                                </button>
                            </form>
                        )}

                        <div style={{ height: 1, background: 'var(--border)', margin: '22px 0' }} />
                        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
                            <Link href="/login" style={{ fontWeight: 700, color: 'var(--accent)' }}>← Back to Login</Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
