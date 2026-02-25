'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getAvailableSessions } from '@/lib/utils';

const BRANCHES = ['CSE', 'IT', 'ECE', 'ME', 'CE'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const SECTIONS = ['A', 'B', 'C', 'D'];

function ProgressBar({ value, color = 'var(--accent)' }) {
    return (
        <div style={{ background: 'var(--surface2)', borderRadius: 999, height: 6, overflow: 'hidden', marginTop: 8 }}>
            <div style={{
                width: `${Math.min(value, 100)}%`, height: '100%',
                background: color, borderRadius: 999,
                transition: 'width 0.6s cubic-bezier(.4,0,.2,1)'
            }} />
        </div>
    );
}

function StatCard({ icon, label, value, color, sub }) {
    return (
        <div className="stat-card" style={{ transition: 'transform 0.18s, box-shadow 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(79,142,247,0.13)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
            <div className={`stat-icon ${color}`}>{icon}</div>
            <div className="stat-label">{label}</div>
            <div className={`stat-value ${color}`}>{value}</div>
            {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>{sub}</div>}
        </div>
    );
}

export default function ReportsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        branch: '', session: '', semester: '', section: '', subject: '', month: '', start_date: '', end_date: ''
    });
    const [view, setView] = useState('overview');
    const [subjects, setSubjects] = useState([]);
    const [availableSessions, setAvailableSessions] = useState([]);
    const [filtersOpen, setFiltersOpen] = useState(true);

    useEffect(() => { setAvailableSessions(getAvailableSessions()); }, []);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        if (status === 'authenticated') {
            if (!filters.branch) setFilters(prev => ({ ...prev, branch: session.user.branch }));
            fetchReports();
        }
    }, [status, filters]);

    async function fetchReports() {
        setLoading(true);
        const params = new URLSearchParams(filters);
        const res = await fetch(`/api/reports?${params}`);
        const result = await res.json();
        setData(result);
        setSubjects(result.subjects || []);
        setLoading(false);
    }

    function handleExport(fmt) {
        const params = new URLSearchParams(filters);
        window.open(`/api/export/${fmt}?${params}`, '_blank');
    }

    const VIEWS = [
        { id: 'overview', label: 'Overview' },
        { id: 'students', label: 'Students' },
        { id: 'subjects', label: 'Subjects' },
        { id: 'register', label: 'Register' },
        { id: 'list', label: 'Records' },
    ];

    const analytics = data?.analytics;
    const records = data?.records || [];
    const lowCount = analytics?.low_attendance?.length || 0;

    return (
        <>
            <Navbar />
            <style>{`
                .tab-bar { display:flex; gap:4px; background:var(--surface2); border-radius:12px; padding:4px; border:1px solid var(--border); }
                .tab-btn { padding:7px 16px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; border:none; font-family:inherit; transition:all 0.18s; background:transparent; color:var(--text2); }
                .tab-btn.active { background:var(--surface); color:var(--text); box-shadow:0 1px 4px rgba(0,0,0,0.15); border:1px solid var(--border); }
                .tab-btn:not(.active):hover { color:var(--accent); background:var(--accent-lite); }
                .pct-row { display:flex; align-items:center; gap:10px; }
                .pct-label { font-size:13px; font-weight:500; flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
                .pct-val { font-size:13px; font-weight:700; font-family:'JetBrains Mono',monospace; min-width:44px; text-align:right; }
                .filter-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; }
                .section-title { font-size:13px; font-weight:700; color:var(--text3); text-transform:uppercase; letter-spacing:.06em; margin-bottom:12px; }
                .att-cell { display:inline-flex; width:26px; height:26px; border-radius:6px; align-items:center; justify-content:center; font-size:11px; font-weight:700; }
                .att-p { background:var(--success-bg); color:var(--success); border:1px solid var(--success-bdr); }
                .att-a { background:var(--danger-bg); color:var(--danger); border:1px solid var(--danger-bdr); }
                .att-dash { background:var(--surface2); color:var(--text3); border:1px solid var(--border); }
                .card-section { background:var(--surface); border:1px solid var(--border); border-radius:16px; overflow:hidden; }
                .card-section-head { padding:16px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; gap:12px; }
                .ring-wrap { position:relative; width:100px; height:100px; margin:0 auto 12px; }
                .ring-wrap svg { transform:rotate(-90deg); }
                .ring-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
            `}</style>

            <main>
                {/* ── PAGE HEADER ── */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Reports & Analytics</h1>
                        <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
                            {filters.branch || 'All Branches'}{filters.semester ? ` · Sem ${filters.semester}` : ''}{filters.section ? ` · Sec ${filters.section}` : ''}{filters.subject ? ` · ${filters.subject}` : ''}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleExport('csv')}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Export CSV
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleExport('txt')}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Export TXT
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={fetchReports} disabled={loading}>
                            {loading ? 'Loading…' : 'Apply Filters'}
                        </button>
                    </div>
                </div>

                {/* ── FILTER CARD ── */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <button
                        onClick={() => setFiltersOpen(o => !o)}
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text)', fontFamily: 'inherit', fontWeight: 600, fontSize: 14 }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <svg style={{ width: 16, height: 16, color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
                            Filters
                        </span>
                        <svg style={{ width: 16, height: 16, color: 'var(--text3)', transition: 'transform 0.2s', transform: filtersOpen ? 'rotate(180deg)' : '' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {filtersOpen && (
                        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
                            <div className="filter-grid" style={{ marginTop: 16 }}>
                                <div className="field-group" style={{ marginBottom: 0 }}>
                                    <label className="field-label">Branch</label>
                                    <select value={filters.branch} onChange={e => setFilters({ ...filters, branch: e.target.value })}>
                                        <option value="">All Branches</option>
                                        {BRANCHES.map(b => <option key={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div className="field-group" style={{ marginBottom: 0 }}>
                                    <label className="field-label">Session</label>
                                    <select value={filters.session} onChange={e => setFilters({ ...filters, session: e.target.value })}>
                                        <option value="">All Sessions</option>
                                        {availableSessions.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="field-group" style={{ marginBottom: 0 }}>
                                    <label className="field-label">Semester</label>
                                    <select value={filters.semester} onChange={e => setFilters({ ...filters, semester: e.target.value })}>
                                        <option value="">All Sem</option>
                                        {SEMESTERS.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="field-group" style={{ marginBottom: 0 }}>
                                    <label className="field-label">Section</label>
                                    <select value={filters.section} onChange={e => setFilters({ ...filters, section: e.target.value })}>
                                        <option value="">All Sec</option>
                                        {SECTIONS.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="field-group" style={{ marginBottom: 0 }}>
                                    <label className="field-label">Subject</label>
                                    <select value={filters.subject} onChange={e => setFilters({ ...filters, subject: e.target.value })}>
                                        <option value="">All Subjects</option>
                                        {subjects.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="field-group" style={{ marginBottom: 0 }}>
                                    <label className="field-label">Month</label>
                                    <input type="month" value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })} />
                                </div>
                            </div>
                            {(filters.branch || filters.session || filters.semester || filters.section || filters.subject || filters.month) && (
                                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-ghost btn-xs" onClick={() => setFilters({ branch: session?.user?.branch || '', session: '', semester: '', section: '', subject: '', month: '', start_date: '', end_date: '' })}>
                                        Clear all filters
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', gap: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
                        <span style={{ color: 'var(--text3)', fontSize: 14 }}>Loading reports…</span>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : !analytics ? null : (
                    <>
                        {/* ── STAT CARDS ── */}
                        <div className="stat-grid">
                            <StatCard
                                color="blue"
                                label="Total Records"
                                value={analytics.total_rows.toLocaleString()}
                                sub={`${analytics.total_classes} class sessions`}
                                icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                            />
                            <StatCard
                                color="green"
                                label="Overall Attendance"
                                value={`${analytics.overall_percentage}%`}
                                sub="across all subjects"
                                icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            />
                            <StatCard
                                color="amber"
                                label="Students Below 75%"
                                value={lowCount}
                                sub={lowCount ? 'need attention' : 'all good!'}
                                icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                            />
                            <StatCard
                                color="red"
                                label="Subjects Tracked"
                                value={analytics.subject_summary.length.toLocaleString()}
                                sub="in selected filters"
                                icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                            />
                        </div>

                        {/* ── TAB NAVIGATION ── */}
                        <div className="tab-bar" style={{ overflowX: 'auto' }}>
                            {VIEWS.map(v => (
                                <button key={v.id} className={`tab-btn ${view === v.id ? 'active' : ''}`} onClick={() => setView(v.id)}>
                                    {v.label}
                                    {v.id === 'students' && analytics.student_summary.length > 0 && (
                                        <span style={{ marginLeft: 6, background: 'var(--accent-lite)', color: 'var(--accent)', borderRadius: 999, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                                            {analytics.student_summary.length}
                                        </span>
                                    )}
                                    {v.id === 'students' && lowCount > 0 && (
                                        <span style={{ marginLeft: 4, background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
                                            {lowCount} low
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* ─────────────── OVERVIEW TAB ─────────────── */}
                        {view === 'overview' && (
                            <div className="anim-fade" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 16, alignItems: 'start' }}>
                                {/* Left: subject breakdown */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div className="card-section">
                                        <div className="card-section-head">
                                            <span style={{ fontWeight: 700, fontSize: 15 }}>Subject Attendance</span>
                                            <span className="badge badge-accent">{analytics.subject_summary.length} subjects</span>
                                        </div>
                                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            {analytics.subject_summary.length === 0 && (
                                                <div className="empty-state" style={{ padding: '32px 0' }}>No data yet</div>
                                            )}
                                            {analytics.subject_summary.map(s => (
                                                <div key={s.subject}>
                                                    <div className="pct-row">
                                                        <span className="pct-label" title={s.subject}>{s.subject}</span>
                                                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{s.present}/{s.total}</span>
                                                        <span className="pct-val" style={{ color: s.percentage < 75 ? 'var(--danger)' : 'var(--success)' }}>{s.percentage}%</span>
                                                    </div>
                                                    <ProgressBar value={s.percentage} color={s.percentage < 75 ? 'var(--danger)' : 'var(--success)'} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Monthly trend */}
                                    {analytics.monthly_summary.length > 0 && (
                                        <div className="card-section">
                                            <div className="card-section-head">
                                                <span style={{ fontWeight: 700, fontSize: 15 }}>Monthly Trend</span>
                                            </div>
                                            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                                                {analytics.monthly_summary.map(m => {
                                                    const [yr, mo] = m.month.split('-');
                                                    const mName = new Date(+yr, +mo - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
                                                    return (
                                                        <div key={m.month}>
                                                            <div className="pct-row">
                                                                <span className="pct-label">{mName}</span>
                                                                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{m.present}/{m.total}</span>
                                                                <span className="pct-val" style={{ color: m.percentage < 75 ? 'var(--danger)' : 'var(--success)' }}>{m.percentage}%</span>
                                                            </div>
                                                            <ProgressBar value={m.percentage} color={m.percentage < 75 ? 'var(--danger)' : 'var(--success)'} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right: overall ring + low attendance */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {/* Ring */}
                                    <div className="card" style={{ padding: '28px 20px', textAlign: 'center' }}>
                                        <div className="ring-wrap">
                                            <svg width="100" height="100" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="10" />
                                                <circle cx="50" cy="50" r="40" fill="none"
                                                    stroke={analytics.overall_percentage < 75 ? 'var(--danger)' : 'var(--success)'}
                                                    strokeWidth="10"
                                                    strokeDasharray={`${2 * Math.PI * 40}`}
                                                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - analytics.overall_percentage / 100)}`}
                                                    strokeLinecap="round"
                                                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                                                />
                                            </svg>
                                            <div className="ring-center">
                                                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'JetBrains Mono', color: analytics.overall_percentage < 75 ? 'var(--danger)' : 'var(--success)' }}>
                                                    {analytics.overall_percentage}%
                                                </div>
                                                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>OVERALL</div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                                            {analytics.total_rows} total records across {analytics.total_classes} sessions
                                        </div>
                                    </div>

                                    {/* Low attendance */}
                                    {lowCount > 0 && (
                                        <div className="card-section">
                                            <div className="card-section-head" style={{ background: 'var(--danger-bg)' }}>
                                                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--danger)' }}>⚠ Below 75%</span>
                                                <span className="badge badge-danger">{lowCount} students</span>
                                            </div>
                                            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                                                {analytics.low_attendance.map(s => (
                                                    <div key={s.student_id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)', gap: 10 }}>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                                                            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'JetBrains Mono' }}>{s.student_id}</div>
                                                        </div>
                                                        <span className="badge badge-danger">{s.percentage}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ─────────────── STUDENTS TAB ─────────────── */}
                        {view === 'students' && (
                            <div className="card-section anim-fade">
                                <div className="card-section-head">
                                    <span style={{ fontWeight: 700, fontSize: 15 }}>Student-wise Attendance</span>
                                    <span className="badge badge-accent">{analytics.student_summary.length} students</span>
                                </div>
                                <div className="table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Roll No</th>
                                                <th>Name</th>
                                                <th>Present</th>
                                                <th>Total</th>
                                                <th style={{ minWidth: 140 }}>Attendance %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.student_summary.map((s, i) => (
                                                <tr key={s.student_id}>
                                                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{i + 1}</td>
                                                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 600 }}>{s.student_id}</td>
                                                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                                                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{s.present}</td>
                                                    <td style={{ color: 'var(--text2)' }}>{s.total}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 999, height: 5, overflow: 'hidden' }}>
                                                                <div style={{ width: `${s.percentage}%`, height: '100%', borderRadius: 999, background: s.percentage < 75 ? 'var(--danger)' : 'var(--success)', transition: 'width 0.5s' }} />
                                                            </div>
                                                            <span style={{ fontSize: 12, fontWeight: 700, minWidth: 38, textAlign: 'right', color: s.percentage < 75 ? 'var(--danger)' : 'var(--success)' }}>
                                                                {s.percentage}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {!analytics.student_summary.length && (
                                                <tr><td colSpan={6} className="empty-state">No student data found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ─────────────── SUBJECTS TAB ─────────────── */}
                        {view === 'subjects' && (
                            <div className="anim-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                                {analytics.subject_summary.length === 0 && (
                                    <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', gridColumn: '1/-1' }}>No subject data found.</div>
                                )}
                                {analytics.subject_summary.map(s => (
                                    <div key={s.subject} className="card" style={{ padding: 20 }}>
                                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.subject}>
                                            {s.subject}
                                        </div>
                                        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                                            <div style={{ textAlign: 'center', flex: 1 }}>
                                                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>{s.present}</div>
                                                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>PRESENT</div>
                                            </div>
                                            <div style={{ textAlign: 'center', flex: 1 }}>
                                                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--danger)' }}>{s.total - s.present}</div>
                                                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>ABSENT</div>
                                            </div>
                                            <div style={{ textAlign: 'center', flex: 1 }}>
                                                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text2)' }}>{s.total}</div>
                                                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>TOTAL</div>
                                            </div>
                                        </div>
                                        <ProgressBar value={s.percentage} color={s.percentage < 75 ? 'var(--danger)' : 'var(--success)'} />
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                            <span className={`badge ${s.percentage < 75 ? 'badge-danger' : 'badge-success'}`}>{s.percentage}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ─────────────── REGISTER TAB ─────────────── */}
                        {view === 'register' && (
                            <div className="card-section anim-fade">
                                <div className="card-section-head">
                                    <span style={{ fontWeight: 700, fontSize: 15 }}>Monthly Register</span>
                                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                                        <span style={{ marginRight: 12 }}><span className="att-cell att-p" style={{ display: 'inline-flex', marginRight: 4 }}>P</span>Present</span>
                                        <span><span className="att-cell att-a" style={{ display: 'inline-flex', marginRight: 4 }}>A</span>Absent</span>
                                    </span>
                                </div>
                                <div className="table-wrap" style={{ overflowX: 'auto' }}>
                                    <table style={{ minWidth: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ position: 'sticky', left: 0, background: 'var(--surface2)', zIndex: 10, minWidth: 180 }}>Student</th>
                                                {analytics.grid_dates.map(d => {
                                                    const dt = new Date(d);
                                                    return (
                                                        <th key={d} style={{ textAlign: 'center', minWidth: 38, padding: '8px 4px' }}>
                                                            <div style={{ fontSize: 11 }}>{dt.getDate()}</div>
                                                            <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 500 }}>{dt.toLocaleString('en', { weekday: 'short' })}</div>
                                                        </th>
                                                    );
                                                })}
                                                <th style={{ textAlign: 'center', position: 'sticky', right: 0, background: 'var(--surface2)', zIndex: 10, minWidth: 60 }}>%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.grid_data.map(s => (
                                                <tr key={s.student_id}>
                                                    <td style={{ position: 'sticky', left: 0, background: 'var(--surface)', fontWeight: 600, borderRight: '1px solid var(--border)', zIndex: 5 }}>
                                                        <div style={{ fontSize: 13 }}>{s.name}</div>
                                                        <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'JetBrains Mono' }}>{s.student_id}</div>
                                                    </td>
                                                    {s.days.map((day, idx) => (
                                                        <td key={idx} style={{ textAlign: 'center', padding: '6px 4px' }}>
                                                            <span className={`att-cell ${day === 'P' ? 'att-p' : day === 'A' ? 'att-a' : 'att-dash'}`}>{day}</span>
                                                        </td>
                                                    ))}
                                                    <td style={{ textAlign: 'center', position: 'sticky', right: 0, background: 'var(--surface)', fontWeight: 700, fontSize: 13, color: s.percentage < 75 ? 'var(--danger)' : 'var(--success)', borderLeft: '1px solid var(--border)', zIndex: 5 }}>
                                                        {s.percentage}%
                                                    </td>
                                                </tr>
                                            ))}
                                            {!analytics.grid_data.length && (
                                                <tr><td colSpan={analytics.grid_dates.length + 2} className="empty-state">No data for selected filters.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ─────────────── RECORDS TAB ─────────────── */}
                        {view === 'list' && (
                            <div className="card-section anim-fade">
                                <div className="card-section-head">
                                    <span style={{ fontWeight: 700, fontSize: 15 }}>Raw Records</span>
                                    <span className="badge badge-accent">{records.length} records</span>
                                </div>
                                <div className="table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Roll No</th>
                                                <th>Name</th>
                                                <th>Subject</th>
                                                <th>Sem</th>
                                                <th>Section</th>
                                                <th style={{ textAlign: 'center' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {records.map((r, i) => (
                                                <tr key={i}>
                                                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>
                                                        {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: 12 }}>{r.student?.student_id}</td>
                                                    <td style={{ fontWeight: 500 }}>{r.student?.name}</td>
                                                    <td style={{ color: 'var(--text2)' }}>{r.subject}</td>
                                                    <td><span className="badge badge-accent">{r.semester}</span></td>
                                                    <td><span className="badge badge-accent">{r.section}</span></td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className={`badge ${r.status === 'Present' ? 'badge-success' : 'badge-danger'}`}>{r.status}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {!records.length && (
                                                <tr><td colSpan={7} className="empty-state">No records match the selected filters.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </>
    );
}
