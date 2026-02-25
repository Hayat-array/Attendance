'use client';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [seeded, setSeeded] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    async function handleDeleteAccount() {
        if (deleteConfirm !== 'DELETE') return;
        setDeleting(true);
        setDeleteError('');
        try {
            const res = await fetch('/api/auth/account', { method: 'DELETE' });
            const d = await res.json();
            if (!res.ok) { setDeleteError(d.error || 'Failed to delete account.'); setDeleting(false); return; }
            await signOut({ redirect: false });
            router.push('/login');
        } catch (e) {
            setDeleteError('Something went wrong.');
            setDeleting(false);
        }
    }

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
    }, [status]);

    useEffect(() => {
        if (status !== 'authenticated') return;
        // Seed default data on first authenticated load
        if (!seeded) {
            fetch('/api/auth/signup').then(() => setSeeded(true));
        }
        fetch('/api/reports').then(r => r.json()).then(setData);
    }, [status, seeded]);

    if (status === 'loading' || !data) return (
        <><Navbar />
            <main><div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Loading dashboard…</div></main>
        </>
    );

    const { analytics, records } = data;

    const stats = [
        { label: 'Total Students', value: data.students?.length || 0, color: 'blue', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { label: 'Total Classes', value: analytics.total_classes, color: 'green', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
        { label: 'Overall Attendance', value: `${analytics.overall_percentage}%`, color: 'amber', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { label: 'Low Attendance', value: analytics.low_attendance?.length || 0, color: 'red', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    ];

    return (
        <>
            <Navbar />
            <main>
                {/* Hero */}
                <div className="card anim-slide" style={{ padding: '28px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 54, height: 54, borderRadius: 14, background: 'linear-gradient(135deg, var(--accent), #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0, boxShadow: '0 0 20px var(--accent-glow)' }}>
                                {session.user.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 700 }}>Welcome, {session.user.name}</div>
                                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: 'var(--accent-lite)', border: '1px solid var(--info-bdr)', color: 'var(--accent)', fontSize: 11, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                                        {session.user.teacher_id}
                                    </span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: 'var(--accent-lite)', border: '1px solid var(--info-bdr)', color: 'var(--accent)', fontSize: 11, fontWeight: 600 }}>
                                        {session.user.branch} Dept.
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <Link href="/attendance" className="btn btn-primary">
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Take Attendance
                            </Link>
                            <Link href="/students" className="btn btn-ghost">Manage Students</Link>
                            <Link href="/reports" className="btn btn-ghost">View Reports</Link>
                            <button className="btn btn-danger" onClick={() => { setShowDeleteModal(true); setDeleteConfirm(''); setDeleteError(''); }}>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="stat-grid">
                    {stats.map((s, i) => (
                        <div key={s.label} className={`stat-card anim-fade d${i + 1}`}>
                            <div className={`stat-icon ${s.color}`}>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={s.icon} /></svg>
                            </div>
                            <div className="stat-label">{s.label}</div>
                            <div className={`stat-value ${s.color}`}>{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Two col */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                    {/* Low Attendance */}
                    <div className="card">
                        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--danger-bg)', border: '1px solid var(--danger-bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700 }}>Low Attendance Alert (&lt;75%)</span>
                        </div>
                        <div style={{ padding: '16px 20px 20px' }}>
                            {analytics.low_attendance?.length ? analytics.low_attendance.slice(0, 8).map(s => (
                                <div key={s.student_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'var(--danger-bg)', border: '1px solid var(--danger-bdr)', marginBottom: 8, fontSize: 13 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, padding: '2px 6px', borderRadius: 5, background: 'var(--danger-bg)', border: '1px solid var(--danger-bdr)', color: 'var(--danger)' }}>{s.student_id}</span>
                                        <span style={{ color: 'var(--text)', fontWeight: 500 }}>{s.name}</span>
                                    </div>
                                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--danger)' }}>{s.percentage}%</span>
                                </div>
                            )) : <div className="empty-state">No students below 75% — great job!</div>}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="card">
                        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 14, fontWeight: 700 }}>Recent Attendance</span>
                            <Link href="/reports" className="btn btn-ghost btn-sm">View All</Link>
                        </div>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        {['Date', 'Student', 'Subject', 'Status'].map(h => <th key={h}>{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {records?.slice(0, 10).map((r, i) => (
                                        <tr key={i}>
                                            <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{new Date(r.date).toLocaleDateString()}</td>
                                            <td>{r.student?.name || '—'}</td>
                                            <td style={{ color: 'var(--text2)' }}>{r.subject}</td>
                                            <td><span className={`badge ${r.status === 'Present' ? 'badge-success' : 'badge-danger'}`}>{r.status}</span></td>
                                        </tr>
                                    ))}
                                    {!records?.length && <tr><td colSpan={4} className="empty-state">No recent records.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} onClick={() => !deleting && setShowDeleteModal(false)} />
                    <div className="card" style={{ width: '100%', maxWidth: 440, position: 'relative', borderRadius: 20, overflow: 'hidden', animation: '0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0s 1 normal both running slideDown', top: '35px' }}>
                        {/* Red accent bar */}
                        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--danger), #dc2626, transparent)' }} />
                        <div style={{ padding: '24px' }}>
                            {/* Icon + Title */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--danger-bg)', border: '1px solid var(--danger-bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: 22, height: 22, color: 'var(--danger)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Delete Account</div>
                                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>This action is permanent and cannot be undone</div>
                                </div>
                            </div>

                            {/* Warning box */}
                            <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-bdr)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: 'var(--danger)', lineHeight: 1.6 }}>
                                ⚠️ This will permanently delete your account <strong>({session.user.teacher_id})</strong> and all attendance records you have created.
                            </div>

                            {/* Confirmation input */}
                            <div className="field-group" style={{ marginBottom: 16 }}>
                                <label className="field-label">Type <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--danger)' }}>DELETE</strong> to confirm</label>
                                <input
                                    type="text"
                                    value={deleteConfirm}
                                    onChange={e => setDeleteConfirm(e.target.value)}
                                    placeholder="DELETE"
                                    autoFocus
                                    style={{ borderColor: deleteConfirm === 'DELETE' ? 'var(--danger)' : undefined }}
                                />
                            </div>

                            {deleteError && <div className="flash error" style={{ marginBottom: 12, fontSize: 13 }}>{deleteError}</div>}

                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</button>
                                <button
                                    className="btn btn-danger"
                                    style={{ flex: 2, justifyContent: 'center', opacity: deleteConfirm !== 'DELETE' ? 0.5 : 1 }}
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirm !== 'DELETE' || deleting}
                                >
                                    {deleting ? 'Deleting…' : 'Yes, Delete My Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
