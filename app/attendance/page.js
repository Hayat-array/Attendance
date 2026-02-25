'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getAvailableSessions } from '@/lib/utils';

const BRANCHES = ['CSE', 'IT', 'ECE', 'ME', 'CE'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const SECTIONS = ['A', 'B', 'C', 'D'];

export default function AttendancePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        branch: '', semester: '', section: '', subject: '', session: '', date: new Date().toISOString().split('T')[0]
    });
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [msg, setMsg] = useState(null);
    const [isOverwrite, setIsOverwrite] = useState(false);
    const [showSubjModal, setShowSubjModal] = useState(false);
    const [newSubjName, setNewSubjName] = useState('');
    const [addingSubj, setAddingSubj] = useState(false);
    const [availableSessions, setAvailableSessions] = useState([]);

    useEffect(() => {
        setAvailableSessions(getAvailableSessions());
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        if (status === 'authenticated' && !form.branch) {
            setForm(prev => ({ ...prev, branch: session.user.branch }));
        }
    }, [status, session]);

    useEffect(() => {
        if (form.branch && form.semester) fetchSubjects();
        else setSubjects([]);
    }, [form.branch, form.semester]);

    async function fetchSubjects() {
        try {
            const res = await fetch(`/api/subjects/${form.branch}/${form.semester}`);
            const data = await res.json();
            // subjects is now array of {_id, name, code}
            setSubjects(data.subjects || []);
        } catch {
            setSubjects([]);
        }
    }

    async function handleProceed() {
        if (!form.branch || !form.semester || !form.section || !form.subject || !form.session || !form.date)
            return setMsg({ type: 'error', text: 'Please fill all class details.' });

        setLoading(true);
        setMsg(null);

        try {
            // Fetch existing attendance for this class/date/subject
            const q = new URLSearchParams(form).toString();
            const snapRes = await fetch(`/api/attendance?${q}`);
            const snap = await snapRes.json();

            // Fetch students for this class — pass session to filter by academic year
            const stuRes = await fetch(
                `/api/students/class/${form.branch}/${form.semester}/${form.section}?session=${encodeURIComponent(form.session)}`
            );
            const stuData = await stuRes.json();
            const stuList = stuData.students || [];

            if (!stuList.length) {
                setMsg({ type: 'error', text: 'No students found for this class and session. Please add students first.' });
                setLoading(false);
                return;
            }

            setStudents(stuList);

            const initialAttendance = {};
            if (snap.exists && snap.records?.length) {
                setMsg({ type: 'warn', text: 'Attendance already recorded for this class and date. You are in edit mode.' });
                setIsOverwrite(true);
                // Map by student ObjectId string
                snap.records.forEach(r => { initialAttendance[r.student_id] = r.status; });
                stuList.forEach(s => { if (!initialAttendance[s.id]) initialAttendance[s.id] = 'Absent'; });
            } else {
                stuList.forEach(s => { initialAttendance[s.id] = 'Present'; });
                setIsOverwrite(false);
            }

            setAttendance(initialAttendance);
            setStep(2);
        } catch (e) {
            setMsg({ type: 'error', text: 'Failed to load data. Please try again.' });
        }
        setLoading(false);
    }

    async function handleSave() {
        setLoading(true);
        setMsg(null);
        const payload = {
            ...form,
            overwrite: isOverwrite,
            attendance: Object.entries(attendance).map(([sid, status]) => ({ student_id: sid, status }))
        };

        const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            return setMsg({ type: 'error', text: data.error || data.message });
        }

        setMsg({ type: 'success', text: data.message });
        setIsOverwrite(true); // mark as overwrite from here on — data was just saved
    }

    async function handleAddSubject() {
        if (!newSubjName.trim()) return;
        if (!form.branch || !form.semester) {
            alert('Please select Branch and Semester first.');
            return;
        }
        setAddingSubj(true);
        const res = await fetch('/api/subjects/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newSubjName.trim(), branch: form.branch, semester: form.semester })
        });
        const d = await res.json();
        setAddingSubj(false);
        if (res.ok && d.success) {
            await fetchSubjects();
            setForm(prev => ({ ...prev, subject: newSubjName.trim() }));
            setShowSubjModal(false);
            setNewSubjName('');
        } else {
            alert(d.message || d.error || 'Failed to add subject.');
        }
    }

    const setStatus = (sid, status) => {
        setAttendance(prev => ({ ...prev, [sid]: status }));
    };

    const presentCount = Object.values(attendance).filter(v => v === 'Present').length;
    const absentCount = Object.values(attendance).filter(v => v === 'Absent').length;

    return (
        <>
            <Navbar />
            <style>{`
                .bubble-wrap {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    justify-content: center;
                }
                .bubble {
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    border: 2.5px solid;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 13px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.18s cubic-bezier(.4,0,.2,1);
                    letter-spacing: 0.02em;
                    user-select: none;
                }
                .bubble-p-active {
                    background: #16a34a;
                    border-color: #16a34a;
                    color: #fff;
                    box-shadow: 0 0 0 4px rgba(22,163,74,0.18);
                    transform: scale(1.08);
                }
                .bubble-p-inactive {
                    background: transparent;
                    border-color: #16a34a55;
                    color: #16a34a88;
                }
                .bubble-p-inactive:hover {
                    border-color: #16a34a;
                    color: #16a34a;
                    background: rgba(22,163,74,0.08);
                }
                .bubble-a-active {
                    background: #dc2626;
                    border-color: #dc2626;
                    color: #fff;
                    box-shadow: 0 0 0 4px rgba(220,38,38,0.18);
                    transform: scale(1.08);
                }
                .bubble-a-inactive {
                    background: transparent;
                    border-color: #dc262655;
                    color: #dc262688;
                }
                .bubble-a-inactive:hover {
                    border-color: #dc2626;
                    color: #dc2626;
                    background: rgba(220,38,38,0.08);
                }
                .att-row {
                    transition: background 0.12s;
                }
                .att-row:hover {
                    background: var(--surface2, #f8fafc) !important;
                }
            `}</style>
            <main>
                <div style={{ marginBottom: '16px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Take Attendance</h1>
                    <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '4px' }}>
                        {step === 1 ? 'Select class, session and subject.' : `${form.branch} | Sem ${form.semester} | Sec ${form.section} | ${form.subject} | ${form.date}`}
                    </p>
                </div>

                {msg && <div className={`flash ${msg.type}`} style={{ marginBottom: '20px' }}>{msg.text}</div>}

                {step === 1 ? (
                    <div className="card anim-slide" style={{ padding: '28px', maxWidth: '620px', margin: '0 auto' }}>
                        <div style={{ display: 'grid', gap: '18px' }}>

                            {/* Row 1: Branch + Date */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="field-group">
                                    <label className="field-label">Branch</label>
                                    <select value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value, subject: '' })}>
                                        <option value="">Select Branch...</option>
                                        {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div className="field-group">
                                    <label className="field-label">Date</label>
                                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                                </div>
                            </div>

                            {/* Row 2: Semester + Section */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="field-group">
                                    <label className="field-label">Semester</label>
                                    <select value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value, subject: '' })}>
                                        <option value="">Select Sem...</option>
                                        {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="field-group">
                                    <label className="field-label">Section</label>
                                    <select value={form.section} onChange={e => setForm({ ...form, section: e.target.value })}>
                                        <option value="">Select Sec...</option>
                                        {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Session */}
                            <div className="field-group">
                                <label className="field-label">Session (Academic Year)</label>
                                <select value={form.session} onChange={e => setForm({ ...form, session: e.target.value })}>
                                    <option value="">Select Session...</option>
                                    {availableSessions.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            {/* Subject */}
                            <div className="field-group">
                                <label className="field-label">Subject</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <select
                                        style={{ flex: 1 }}
                                        value={form.subject}
                                        onChange={e => setForm({ ...form, subject: e.target.value })}
                                    >
                                        <option value="">
                                            {!form.branch || !form.semester
                                                ? 'Select branch & semester first...'
                                                : subjects.length === 0
                                                    ? 'No subjects yet — click + to add'
                                                    : 'Select Subject...'}
                                        </option>
                                        {subjects.map(s => (
                                            <option key={s._id} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        className="btn btn-ghost"
                                        style={{ padding: '0 14px', fontSize: '20px', fontWeight: 700 }}
                                        onClick={() => setShowSubjModal(true)}
                                        title="Add New Subject"
                                        type="button"
                                    >+</button>
                                </div>
                                {form.branch && form.semester && subjects.length === 0 && (
                                    <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '6px' }}>
                                        💡 No subjects added yet. Click <strong>+</strong> to add your subjects for this class.
                                    </p>
                                )}
                            </div>

                            <button
                                className="btn btn-primary"
                                style={{ justifyContent: 'center', padding: '13px' }}
                                onClick={handleProceed}
                                disabled={loading}
                            >
                                {loading ? 'Loading students...' : 'Proceed to Mark Attendance →'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="anim-slide">
                        {/* Summary bar */}
                        <div className="card" style={{ padding: '14px 20px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', flexWrap: 'wrap' }}>
                                <span><strong>Branch:</strong> {form.branch}</span>
                                <span><strong>Sem:</strong> {form.semester}</span>
                                <span><strong>Sec:</strong> {form.section}</span>
                                <span><strong>Subject:</strong> {form.subject}</span>
                                <span><strong>Session:</strong> {form.session}</span>
                                <span><strong>Date:</strong> {form.date}</span>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setStep(1); setMsg(null); }}>← Back</button>
                        </div>

                        {/* Totals */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', fontSize: '14px' }}>
                            <div className="card" style={{ padding: '12px 20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#16a34a' }} />
                                <span>Present: <strong style={{ color: '#16a34a' }}>{presentCount}</strong></span>
                            </div>
                            <div className="card" style={{ padding: '12px 20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#dc2626' }} />
                                <span>Absent: <strong style={{ color: '#dc2626' }}>{absentCount}</strong></span>
                            </div>
                            <div className="card" style={{ padding: '12px 20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span>Total: <strong>{students.length}</strong></span>
                            </div>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => {
                                        const all = {};
                                        students.forEach(s => { all[s.id] = 'Present'; });
                                        setAttendance(all);
                                    }}
                                >All Present</button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => {
                                        const all = {};
                                        students.forEach(s => { all[s.id] = 'Absent'; });
                                        setAttendance(all);
                                    }}
                                >All Absent</button>
                            </div>
                        </div>

                        {/* Student Table */}
                        <div className="card" style={{ overflow: 'hidden' }}>
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '48px' }}>#</th>
                                            <th>Roll No</th>
                                            <th>Student Name</th>
                                            <th style={{ textAlign: 'center', width: '120px' }}>Attendance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((s, idx) => {
                                            const status = attendance[s.id];
                                            const isPresent = status === 'Present';
                                            const isAbsent = status === 'Absent';
                                            return (
                                                <tr key={s.id} className="att-row">
                                                    <td style={{ color: 'var(--text3)', fontSize: '12px', textAlign: 'center' }}>{idx + 1}</td>
                                                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 600 }}>{s.student_id}</td>
                                                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                                                    <td>
                                                        <div className="bubble-wrap">
                                                            {/* Present Bubble */}
                                                            <button
                                                                className={`bubble ${isPresent ? 'bubble-p-active' : 'bubble-p-inactive'}`}
                                                                onClick={() => setStatus(s.id, 'Present')}
                                                                title="Mark Present"
                                                                type="button"
                                                            >P</button>
                                                            {/* Absent Bubble */}
                                                            <button
                                                                className={`bubble ${isAbsent ? 'bubble-a-active' : 'bubble-a-inactive'}`}
                                                                onClick={() => setStatus(s.id, 'Absent')}
                                                                title="Mark Absent"
                                                                type="button"
                                                            >A</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button className="btn btn-ghost" onClick={() => { setStep(1); setMsg(null); }}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                                    {loading ? 'Saving...' : isOverwrite ? '✏️ Update Attendance' : '✅ Submit Attendance'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Subject Modal */}
                {showSubjModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={() => setShowSubjModal(false)} />
                        <div className="card anim-slide" style={{ width: '100%', maxWidth: '420px', padding: '28px', position: 'relative', zIndex: 1 }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Add New Subject</h2>
                            <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '20px' }}>
                                Adding subject for <strong>{form.branch || '—'}</strong> — Semester <strong>{form.semester || '—'}</strong>.<br />
                                Only you will see this subject.
                            </p>
                            <div className="field-group" style={{ marginBottom: '20px' }}>
                                <label className="field-label">Subject Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Data Structures, Mathematics-III"
                                    value={newSubjName}
                                    onChange={e => setNewSubjName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                                    autoFocus
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    className="btn btn-primary"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                    onClick={handleAddSubject}
                                    disabled={addingSubj}
                                >
                                    {addingSubj ? 'Adding...' : 'Add Subject'}
                                </button>
                                <button
                                    className="btn btn-ghost"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                    onClick={() => { setShowSubjModal(false); setNewSubjName(''); }}
                                >Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
