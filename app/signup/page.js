'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const BRANCHES = ['CSE', 'IT', 'ECE', 'ME', 'CE'];

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1=form, 2=otp
    const [form, setForm] = useState({ name: '', email: '', branch: '', password: '', confirm_password: '' });
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
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

    async function handleSignup(e) {
        e.preventDefault();
        setMsg(null);
        if (form.password !== form.confirm_password) return setMsg({ type: 'error', text: 'Passwords do not match.' });
        if (form.password.length < 6) return setMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
        setLoading(true);
        const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) return setMsg({ type: 'error', text: data.error });
        setMsg({ type: 'success', text: 'OTP sent to your email!' });
        setStep(2);
    }

    function handleOtpKey(idx, e) {
        const val = e.target.value.replace(/\D/g, '');
        if (!val && e.nativeEvent.inputType !== 'deleteContentBackward') return;
        const next = [...otpDigits];
        if (val) {
            next[idx] = val[val.length - 1];
            setOtpDigits(next);
            if (idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
        } else {
            next[idx] = '';
            setOtpDigits(next);
        }
    }
    function handleOtpKeyDown(idx, e) {
        if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0)
            document.getElementById(`otp-${idx - 1}`)?.focus();
    }
    function handleOtpPaste(e) {
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!text) return;
        e.preventDefault();
        const next = [...otpDigits];
        text.split('').forEach((c, i) => { next[i] = c; });
        setOtpDigits(next);
        document.getElementById(`otp-${Math.min(text.length, 5)}`)?.focus();
    }

    async function handleVerify(e) {
        e.preventDefault();
        const otp = otpDigits.join('');
        if (otp.length < 6) return setMsg({ type: 'error', text: 'Please enter all 6 digits.' });
        setMsg(null);
        setLoading(true);
        const res = await fetch('/api/auth/verify-signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, otp }) });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) return setMsg({ type: 'error', text: data.error });
        setMsg({ type: 'success', text: data.message });
        setTimeout(() => router.push('/login'), 1500);
    }

    const inputStyle = { paddingLeft: 14 };

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
                    <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 5 }}>College Management Portal</div>
                </div>

                <div className="card" style={{ width: '100%', maxWidth: 480, borderRadius: 20, overflow: 'hidden', animation: 'slideDown 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                    <div style={{ height: 3, background: 'linear-gradient(90deg, var(--accent), #1d4ed8, transparent)' }} />
                    <div style={{ padding: '32px' }}>
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)' }}>{step === 1 ? 'Create Teacher Account' : 'Verify Your Email'}</div>
                            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8, lineHeight: 1.6 }}>
                                {step === 1 ? 'Fill in your details to register.' : `Enter the OTP sent to ${form.email}`}
                            </p>
                        </div>

                        {msg && (
                            <div className={`flash ${msg.type}`} style={{ marginBottom: 20 }}>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {msg.text}
                            </div>
                        )}

                        {step === 1 ? (
                            <form onSubmit={handleSignup}>
                                {[['name', 'Full Name', 'text', 'e.g. Dr. Smith'], ['email', 'Email', 'email', 'teacher@college.edu']].map(([key, label, type, ph]) => (
                                    <div key={key} className="field-group">
                                        <label className="field-label">{label}</label>
                                        <input type={type} placeholder={ph} required value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
                                    </div>
                                ))}
                                <div className="field-group">
                                    <label className="field-label">Branch / Department</label>
                                    <select required value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} style={inputStyle}>
                                        <option value="">Select branch…</option>
                                        {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                {[['password', 'Password', 'Create a password'], ['confirm_password', 'Confirm Password', 'Repeat your password']].map(([key, label, ph]) => (
                                    <div key={key} className="field-group">
                                        <label className="field-label">{label}</label>
                                        <input type="password" placeholder={ph} required value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
                                    </div>
                                ))}
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15, borderRadius: 11 }} disabled={loading}>
                                    {loading ? 'Sending OTP…' : 'Send Verification Code →'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerify}>
                                <div className="field-group">
                                    <label className="field-label" style={{ textAlign: 'center', display: 'block' }}>Enter 6-Digit OTP</label>
                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 4 }} onPaste={handleOtpPaste}>
                                        {otpDigits.map((d, i) => (
                                            <input
                                                key={i}
                                                id={`otp-${i}`}
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
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15, borderRadius: 11 }} disabled={loading || otpDigits.join('').length < 6}>
                                    {loading ? 'Verifying…' : 'Verify & Create Account'}
                                </button>
                                <button type="button" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={() => setStep(1)}>
                                    ← Back
                                </button>
                            </form>
                        )}

                        <div style={{ height: 1, background: 'var(--border)', margin: '22px 0' }} />
                        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
                            Already have an account?&nbsp;<Link href="/login" style={{ fontWeight: 700, color: 'var(--accent)' }}>Sign In</Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
