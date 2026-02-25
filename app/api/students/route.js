import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import mongoose from 'mongoose';

const BRANCHES = ['CSE', 'IT', 'ECE', 'ME', 'CE'];
const SECTIONS = ['A', 'B', 'C', 'D'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const session_filter = searchParams.get('session') || '';
    const branch_filter = searchParams.get('branch') || '';

    // Query for students managed by the current teacher (new or old schema)
    const teacherId = new mongoose.Types.ObjectId(session.user.id);
    const query = {
        $or: [
            { teachers: teacherId },
            { added_by: teacherId }
        ]
    };

    if (branch_filter) query.branch = branch_filter;
    if (session_filter) query.session_year = session_filter;
    if (search) {
        query.$and = query.$and || [];
        query.$and.push({
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { student_id: { $regex: search, $options: 'i' } },
                { class_name: { $regex: search, $options: 'i' } },
            ]
        });
    }

    const students = await Student.find(query).sort({ branch: 1, semester: 1, section: 1, student_id: 1 });
    return NextResponse.json({ students });
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await dbConnect();

        const data = await req.json();
        const { student_id, name, branch, class_name, semester, section, session_year, email, phone } = data;

        const errors = [];
        if (!student_id) errors.push('Roll Number is required.');
        if (!name) errors.push('Student name is required.');
        if (!BRANCHES.includes(branch)) errors.push('Invalid branch: ' + branch);
        if (!SEMESTERS.includes(parseInt(semester))) errors.push('Invalid semester.');
        if (!SECTIONS.includes(section)) errors.push('Invalid section.');
        if (!session_year) errors.push('Session year is required.');
        if (errors.length) return NextResponse.json({ error: errors.join(' ') }, { status: 400 });

        // Link current teacher to student (upsert teacher list)
        const teacherId = new mongoose.Types.ObjectId(session.user.id);
        const s = await Student.findOneAndUpdate(
            { student_id },
            {
                $set: {
                    name, branch,
                    class_name: class_name || `${branch}-${section}-Sem${semester}`,
                    semester: parseInt(semester), section, session_year,
                    email: email || undefined, phone: phone || undefined
                },
                $addToSet: { teachers: teacherId },
                $unset: { added_by: "" }
            },
            { upsert: true, returnDocument: 'after' }
        );

        console.log(`[API Student Add] Student ${student_id} linked to teacher ${session.user.id}`);
        return NextResponse.json({ success: true, student: s });
    } catch (e) {
        console.error('[API Student Add] Error:', e.message);
        return NextResponse.json({ error: 'Database error: ' + e.message }, { status: 500 });
    }
}
