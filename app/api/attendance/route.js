import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import mongoose from 'mongoose';

function normalizeStatus(v) {
    const c = String(v || '').trim().toLowerCase();
    if (c === 'present') return 'Present';
    if (c === 'absent') return 'Absent';
    return null;
}

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch') || '';
    const sessionN = searchParams.get('session') || '';
    const section = searchParams.get('section') || '';
    const subject = searchParams.get('subject') || '';
    const dateRaw = searchParams.get('date') || '';
    const semRaw = searchParams.get('semester') || '';

    if (!branch || !sessionN || !section || !subject || !dateRaw || !semRaw || !/^\d+$/.test(semRaw))
        return NextResponse.json({ exists: false, records: [] });

    const attendanceDate = new Date(dateRaw);
    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const teacherId = new mongoose.Types.ObjectId(session.user.id);
    const records = await Attendance.find({
        teacher: teacherId, branch, session: sessionN,
        semester: parseInt(semRaw), section, subject,
        date: { $gte: attendanceDate, $lt: nextDay },
    });
    return NextResponse.json({
        exists: records.length > 0,
        records: records.map(r => ({ student_id: r.student.toString(), status: r.status })),
    });
}

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const data = await req.json();
    const { branch, session: sessionN, semester, section, subject, date, attendance, overwrite } = data;
    if (!branch || !sessionN || !semester || !section || !subject || !date || !attendance?.length)
        return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });

    const sem = parseInt(semester);
    const attendanceDate = new Date(date);
    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Validate students
    const teacherId = new mongoose.Types.ObjectId(session.user.id);
    const validStudents = {};
    const students = await Student.find({
        $or: [
            { teachers: teacherId },
            { added_by: teacherId }
        ],
        branch, semester: sem, section
    }).sort({ student_id: 1 }).lean();
    for (const s of students) validStudents[s._id.toString()] = s;
    if (!students.length)
        return NextResponse.json({ success: false, message: 'No students found.' }, { status: 404 });

    const prepared = [];
    for (const item of attendance) {
        const sid = String(item.student_id);
        if (!validStudents[sid]) return NextResponse.json({ success: false, message: 'Student list changed. Reload.' }, { status: 400 });
        const status = normalizeStatus(item.status);
        if (!status) return NextResponse.json({ success: false, message: 'Status must be Present or Absent.' }, { status: 400 });
        prepared.push({ student: validStudents[sid], status });
    }

    const existing = await Attendance.find({
        teacher: teacherId, branch, semester: sem, section, subject, session: sessionN,
        date: { $gte: attendanceDate, $lt: nextDay },
    });

    if (existing.length && !overwrite)
        return NextResponse.json({ success: false, requires_overwrite: true, message: 'Attendance already exists. Enable overwrite to update.' }, { status: 409 });

    const now = new Date();
    if (existing.length) {
        const byStudent = {};
        for (const r of existing) byStudent[r.student.toString()] = r;
        const incomingIds = new Set();
        for (const item of prepared) {
            const sid = item.student._id.toString();
            incomingIds.add(sid);
            if (byStudent[sid]) {
                byStudent[sid].status = item.status;
                byStudent[sid].taken_at = now;
                await byStudent[sid].save();
            } else {
                await Attendance.create({ teacher: teacherId, student: item.student._id, subject, semester: sem, branch, section, session: sessionN, date: attendanceDate, status: item.status, taken_at: now });
            }
        }
        for (const [sid, rec] of Object.entries(byStudent)) {
            if (!incomingIds.has(sid)) await rec.deleteOne();
        }
    } else {
        for (const item of prepared) {
            await Attendance.create({ teacher: teacherId, student: item.student._id, subject, semester: sem, branch, section, session: sessionN, date: attendanceDate, status: item.status, taken_at: now });
        }
    }
    return NextResponse.json({ success: true, message: 'Attendance saved successfully.' });
}
