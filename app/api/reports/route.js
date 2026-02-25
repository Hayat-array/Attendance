import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import Subject from '@/models/Subject';
import mongoose from 'mongoose';

function buildQuery(teacherId, filters) {
    const q = { teacher: new mongoose.Types.ObjectId(teacherId) };
    if (filters.branch) q.branch = filters.branch;
    if (filters.session) q.session = filters.session;
    if (filters.semester) q.semester = parseInt(filters.semester);
    if (filters.section) q.section = filters.section;
    if (filters.subject) q.subject = filters.subject;
    if (filters.month) {
        const [y, m] = filters.month.split('-').map(Number);
        q.date = { $gte: new Date(y, m - 1, 1), $lt: m === 12 ? new Date(y + 1, 0, 1) : new Date(y, m, 1) };
    } else {
        if (filters.start_date) q.date = { ...q.date, $gte: new Date(filters.start_date) };
        if (filters.end_date) q.date = { ...q.date, $lte: new Date(filters.end_date) };
    }
    return q;
}

export function attendanceAnalytics(records) {
    if (!records.length) return { total_rows: 0, total_classes: 0, overall_percentage: 0, student_summary: [], subject_summary: [], monthly_summary: [], low_attendance: [], grid_dates: [], grid_data: [] };
    const classKeys = new Set();
    let presentRows = 0;
    const studentMap = {};
    const subjectMap = {};
    const monthMap = {};

    for (const r of records) {
        const dateStr = typeof r.date === 'string' ? r.date : r.date.toISOString().split('T')[0];
        classKeys.add(`${dateStr}|${r.subject}|${r.branch}|${r.semester}|${r.section}|${r.session}`);
        if (r.status === 'Present') presentRows++;

        const sid = r.student?._id?.toString() || r.student?.toString();
        const srid = r.student?.student_id || sid;
        const snm = r.student?.name || 'Unknown';
        const st = studentMap[sid] || (studentMap[sid] = { student_id: srid, name: snm, present: 0, total: 0 });
        st.total++; if (r.status === 'Present') st.present++;

        const ss = subjectMap[r.subject] || (subjectMap[r.subject] = { subject: r.subject, present: 0, total: 0 });
        ss.total++; if (r.status === 'Present') ss.present++;

        const mk = dateStr.slice(0, 7);
        const ms = monthMap[mk] || (monthMap[mk] = { month: mk, present: 0, total: 0 });
        ms.total++; if (r.status === 'Present') ms.present++;
    }

    const pct = (p, t) => t ? Math.round(p / t * 1000) / 10 : 0;
    const student_summary = Object.values(studentMap).map(s => ({ ...s, percentage: pct(s.present, s.total) })).sort((a, b) => a.student_id > b.student_id ? 1 : -1);
    const subject_summary = Object.values(subjectMap).map(s => ({ ...s, percentage: pct(s.present, s.total) })).sort((a, b) => a.subject > b.subject ? 1 : -1);
    const monthly_summary = Object.keys(monthMap).sort().map(k => ({ ...monthMap[k], percentage: pct(monthMap[k].present, monthMap[k].total) }));
    const low_attendance = student_summary.filter(s => s.percentage < 75);
    const overall_percentage = records.length ? pct(presentRows, records.length) : 0;

    const all_dates = [...new Set(records.map(r => typeof r.date === 'string' ? r.date : r.date.toISOString().split('T')[0]))].sort();
    const gridMap = {};
    const studentInfo = {};
    for (const r of records) {
        const sid = r.student?.student_id;
        const snm = r.student?.name;
        const ds = typeof r.date === 'string' ? r.date : r.date.toISOString().split('T')[0];
        if (sid) { studentInfo[sid] = snm; if (!gridMap[sid]) gridMap[sid] = {}; gridMap[sid][ds] = r.status === 'Present' ? 'P' : 'A'; }
    }
    const grid_data = Object.entries(studentInfo).map(([sid, snm]) => {
        const days = all_dates.map(d => gridMap[sid]?.[d] || '-');
        const present = days.filter(d => d === 'P').length;
        return { student_id: sid, name: snm, days, present, total: all_dates.length, percentage: pct(present, all_dates.length) };
    }).sort((a, b) => a.student_id > b.student_id ? 1 : -1);

    return { total_rows: records.length, total_classes: classKeys.size, overall_percentage, student_summary, subject_summary, monthly_summary, low_attendance, grid_dates: all_dates, grid_data };
}

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const sp = new URL(req.url).searchParams;
    const filters = {
        branch: sp.get('branch') || '', session: sp.get('session') || '',
        semester: sp.get('semester') || '', section: sp.get('section') || '',
        subject: sp.get('subject') || '', month: sp.get('month') || '',
        start_date: sp.get('start_date') || '', end_date: sp.get('end_date') || '',
    };
    const teacherId = new mongoose.Types.ObjectId(session.user.id);
    const query = buildQuery(teacherId, filters);
    const records = await Attendance.find(query).populate('student', 'student_id name').sort({ date: -1 }).limit(500).lean();
    const students = await Student.find({
        $or: [
            { teachers: teacherId },
            { added_by: teacherId }
        ]
    }).sort({ student_id: 1 }).lean();
    const subjects = await Subject.find({ branch: session.user.branch }).distinct('name');
    const analytics = attendanceAnalytics(records);
    return NextResponse.json({ records: records.slice(0, 300), analytics, students, subjects, filters });
}
