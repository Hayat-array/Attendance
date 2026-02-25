'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getAvailableSessions } from '@/lib/utils';

const BRANCHES = ['CSE', 'IT', 'ECE', 'ME', 'CE'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const SECTIONS = ['A', 'B', 'C', 'D'];

export default function StudentsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const fileInputRef = useRef(null);

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ branch: '', session: '' });
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkData, setBulkData] = useState('');
    const [bulkFileName, setBulkFileName] = useState('');
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkMsg, setBulkMsg] = useState(null);
    const [form, setForm] = useState({
        student_id: '', name: '', branch: '', semester: 1, section: 'A', session_year: '', email: '', phone: ''
    });
    const [availableSessions, setAvailableSessions] = useState([]);
    const [msg, setMsg] = useState(null);

    // Delete with password
    const [deleteTarget, setDeleteTarget] = useState(null); // student object
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        setAvailableSessions(getAvailableSessions());
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        if (status === 'authenticated') {
            fetchStudents();
            setForm(prev => ({ ...prev, branch: session.user.branch }));
        }
    }, [status, filters]);

    async function fetchStudents() {
        setLoading(true);
        const params = new URLSearchParams({ ...filters, search });
        const res = await fetch(`/api/students?${params}`);
        const data = await res.json();
        setStudents(data.students || []);
        setLoading(false);
    }

    async function handleAdd(e) {
        e.preventDefault();
        setMsg(null);
        const res = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });
        const data = await res.json();
        if (!res.ok) return setMsg({ type: 'error', text: data.error });
        setMsg({ type: 'success', text: 'Student added successfully!' });
        setForm({ student_id: '', name: '', branch: '', semester: 1, section: 'A', session_year: '', email: '', phone: '' });
        setShowModal(false);
        fetchStudents();
    }

    // Open delete modal
    function promptDelete(student) {
        setDeleteTarget(student);
        setDeletePassword('');
        setDeleteError('');
    }

    // Confirm delete — password must equal the student's roll no
    async function confirmDelete() {
        if (!deleteTarget) return;
        if (deletePassword !== deleteTarget.student_id) {
            setDeleteError('Incorrect password. Enter the student roll number to confirm.');
            return;
        }
        setDeleteLoading(true);
        setDeleteError('');
        const res = await fetch(`/api/students/${deleteTarget._id}`, { method: 'DELETE' });
        setDeleteLoading(false);
        if (res.ok) {
            setDeleteTarget(null);
            fetchStudents();
        } else {
            const d = await res.json();
            setDeleteError(d.error || 'Failed to delete student.');
        }
    }

    // Handle CSV file selection
    function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setBulkFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => setBulkData(ev.target.result);
        reader.readAsText(file);
    }

    // Handle drag & drop
    function handleDrop(e) {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        setBulkFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => setBulkData(ev.target.result);
        reader.readAsText(file);
    }

    async function handleBulkUpload() {
        if (!bulkData.trim()) return setBulkMsg({ type: 'error', text: 'No CSV data. Choose a file or paste data.' });
        setBulkLoading(true);
        setBulkMsg(null);
        const res = await fetch('/api/students/bulk-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ csvData: bulkData })
        });
        const d = await res.json();
        setBulkLoading(false);
        if (!res.ok) return setBulkMsg({ type: 'error', text: d.error });
        setBulkMsg({ type: 'success', text: `✅ Uploaded ${d.success} students.${d.failed ? ` Failed: ${d.failed}.` : ''}` });
        fetchStudents();
        if (d.failed === 0) setTimeout(() => setShowBulkModal(false), 1500);
    }

    return (
        <>
            <Navbar />
            <main>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '8px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Student Management</h1>
                        <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '4px' }}>Add, search, and manage student records.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            Add Student
                        </button>
                        <button className="btn btn-ghost" onClick={() => { setShowBulkModal(true); setBulkMsg(null); setBulkData(''); setBulkFileName(''); }}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Import CSV
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        <div className="input-wrap">
                            <span className="input-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
                            <input type="text" className="input-with-icon" placeholder="Search by name or roll no..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchStudents()} />
                        </div>
                        <select value={filters.branch} onChange={e => setFilters({ ...filters, branch: e.target.value })}>
                            <option value="">All Branches</option>
                            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <select value={filters.session} onChange={e => setFilters({ ...filters, session: e.target.value })} style={{ flex: 1 }}>
                            <option value="">All Sessions</option>
                            {availableSessions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button className="btn btn-ghost" onClick={fetchStudents}>Filter</button>
                    </div>
                </div>

                {/* Student Table */}
                <div className="card" style={{ overflow: 'hidden' }}>
                    <div className="table-wrap">
                        {loading ? <div className="empty-state">Loading students...</div> : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Roll Number</th>
                                        <th>Name</th>
                                        <th>Branch</th>
                                        <th>Semester</th>
                                        <th>Section</th>
                                        <th>Session</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(s => (
                                        <tr key={s._id}>
                                            <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: '12px' }}>{s.student_id}</td>
                                            <td>{s.name}</td>
                                            <td><span className="badge badge-accent">{s.branch}</span></td>
                                            <td>{s.semester}</td>
                                            <td>{s.section}</td>
                                            <td>{s.session_year}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn btn-danger btn-xs" onClick={() => promptDelete(s)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {!students.length && <tr><td colSpan={7} className="empty-state">No students found.</td></tr>}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* ── Add Student Modal ── */}
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }} onClick={() => setShowModal(false)} />
                        <div className="card" style={{ width: '100%', maxWidth: '520px', position: 'relative', borderRadius: '20px', overflow: 'hidden', animation: '0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0s 1 normal both running slideDown', top: '35px' }}>
                            <div style={{ height: 4, background: 'linear-gradient(90deg, var(--accent), #1d4ed8, transparent)' }} />
                            <div style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)', padding: '18px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" style={{ width: 20, height: 20, color: '#fff' }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Add New Student</div>
                                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Fill in the details below to enroll a student</div>
                                    </div>
                                    <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>

                            <div style={{ padding: '16px 24px 24px' }}>
                                {msg && <div className={`flash ${msg.type}`} style={{ marginBottom: 16, fontSize: 13 }}>{msg.text}</div>}
                                <form onSubmit={handleAdd}>
                                    <div className="field-group" style={{ marginBottom: 14 }}>
                                        <label className="field-label">Full Name</label>
                                        <input type="text" required placeholder="e.g. Rahul Sharma" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                                        <div className="field-group">
                                            <label className="field-label">Roll Number</label>
                                            <input type="text" required placeholder="e.g. CS2301" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} />
                                        </div>
                                        <div className="field-group">
                                            <label className="field-label">Branch / Dept</label>
                                            <select required value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })}>
                                                <option value="">Select…</option>
                                                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                                        <div className="field-group">
                                            <label className="field-label">Semester</label>
                                            <select required value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
                                                {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                                            </select>
                                        </div>
                                        <div className="field-group">
                                            <label className="field-label">Section</label>
                                            <select required value={form.section} onChange={e => setForm({ ...form, section: e.target.value })}>
                                                {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="field-group" style={{ marginBottom: 14 }}>
                                        <label className="field-label">Academic Session</label>
                                        <select required value={form.session_year} onChange={e => setForm({ ...form, session_year: e.target.value })}>
                                            <option value="">Select session…</option>
                                            {availableSessions.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 14px' }} />
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                            Enroll Student
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Import CSV Modal ── */}
                {showBulkModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }} onClick={() => setShowBulkModal(false)} />
                        <div className="card" style={{ width: '100%', maxWidth: '560px', position: 'relative', borderRadius: 20, overflow: 'hidden', animation: '0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0s 1 normal both running slideDown', top: '35px' }}>
                            <div style={{ height: 4, background: 'linear-gradient(90deg, var(--accent), #1d4ed8, transparent)' }} />
                            <div style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)', padding: '18px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" style={{ width: 20, height: 20, color: '#fff' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Import CSV</div>
                                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Upload a CSV file or paste data directly</div>
                                    </div>
                                    <button onClick={() => setShowBulkModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex' }}>
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>

                            <div style={{ padding: '20px 24px 24px' }}>
                                {/* Column format hint */}
                                <div style={{ background: 'var(--accent-lite)', border: '1px solid var(--info-bdr)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text2)' }}>
                                    <strong style={{ color: 'var(--accent)' }}>Column order (header optional):</strong><br />
                                    <code style={{ fontFamily: 'JetBrains Mono', color: 'var(--text3)', fontSize: 11 }}>Roll No, Name, Branch, Sem, Section, Session, Email, Phone</code>
                                </div>

                                {/* Drag & drop file zone */}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={handleDrop}
                                    style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: '20px', textAlign: 'center', cursor: 'pointer', marginBottom: 12, transition: 'border-color 0.2s, background 0.2s', background: bulkFileName ? 'var(--accent-lite)' : 'var(--surface2)' }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                >
                                    <input ref={fileInputRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleFileChange} />
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" style={{ width: 36, height: 36, color: bulkFileName ? 'var(--accent)' : 'var(--text3)', margin: '0 auto 8px' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {bulkFileName
                                        ? <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>📎 {bulkFileName}</div>
                                        : <>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Click to choose CSV file</div>
                                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>or drag & drop here</div>
                                        </>
                                    }
                                </div>

                                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>— or paste CSV data below —</div>

                                <textarea
                                    style={{ width: '100%', minHeight: '120px', fontFamily: 'JetBrains Mono', fontSize: '12px', marginBottom: '14px', borderRadius: 10, resize: 'vertical' }}
                                    placeholder={'85, Hayat Ali, CSE, 6, B, 2025-26'}
                                    value={bulkData}
                                    onChange={e => { setBulkData(e.target.value); setBulkFileName(''); }}
                                />

                                {bulkMsg && (
                                    <div className={`flash ${bulkMsg.type}`} style={{ marginBottom: 12, fontSize: 13 }}>{bulkMsg.text}</div>
                                )}

                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button className="btn btn-ghost" onClick={() => setShowBulkModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                                    <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleBulkUpload} disabled={bulkLoading}>
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                        {bulkLoading ? 'Uploading…' : 'Upload Students'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Delete Student Modal (password = roll no) ── */}
                {deleteTarget && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} onClick={() => !deleteLoading && setDeleteTarget(null)} />
                        <div className="card" style={{ width: '100%', maxWidth: 420, position: 'relative', borderRadius: 20, overflow: 'hidden', animation: '0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0s 1 normal both running slideDown', top: '35px' }}>
                            <div style={{ height: 4, background: 'linear-gradient(90deg, var(--danger), #dc2626, transparent)' }} />
                            <div style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--danger-bg)', border: '1px solid var(--danger-bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: 22, height: 22, color: 'var(--danger)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Delete Student</div>
                                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>This will remove all attendance records</div>
                                    </div>
                                </div>

                                <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-bdr)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, lineHeight: 1.6 }}>
                                    <strong style={{ color: 'var(--text)' }}>{deleteTarget.name}</strong>
                                    <span style={{ color: 'var(--text3)' }}> — </span>
                                    <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--danger)', fontSize: 12 }}>{deleteTarget.student_id}</span>
                                </div>

                                <div className="field-group" style={{ marginBottom: 14 }}>
                                    <label className="field-label">
                                        Enter student roll number to confirm&nbsp;
                                        <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--danger)', fontSize: 11 }}>({deleteTarget.student_id})</span>
                                    </label>
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder={deleteTarget.student_id}
                                        value={deletePassword}
                                        onChange={e => { setDeletePassword(e.target.value); setDeleteError(''); }}
                                        style={{ borderColor: deletePassword && deletePassword === deleteTarget.student_id ? 'var(--danger)' : undefined }}
                                    />
                                </div>

                                {deleteError && <div className="flash error" style={{ marginBottom: 12, fontSize: 13 }}>{deleteError}</div>}

                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>Cancel</button>
                                    <button
                                        className="btn btn-danger"
                                        style={{ flex: 2, justifyContent: 'center', opacity: deletePassword !== deleteTarget.student_id ? 0.5 : 1 }}
                                        onClick={confirmDelete}
                                        disabled={deletePassword !== deleteTarget.student_id || deleteLoading}
                                    >
                                        {deleteLoading ? 'Deleting…' : 'Delete Student'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </>
    );
}
