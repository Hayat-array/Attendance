import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Student from '@/models/Student';
import mongoose from 'mongoose';

export async function GET(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const resolvedParams = await params;
    const { branch, semester, section } = resolvedParams;

    // Optional session_year filter from query string
    const { searchParams } = new URL(req.url);
    const session_year = searchParams.get('session') || '';

    const teacherId = new mongoose.Types.ObjectId(session.user.id);

    const query = {
        $or: [
            { teachers: teacherId },
            { added_by: teacherId }
        ],
        branch,
        semester: parseInt(semester),
        section,
    };

    // Filter by session year if provided — ensures different sessions stay separate
    if (session_year) query.session_year = session_year;

    const students = await Student.find(query).sort({ student_id: 1 });

    return NextResponse.json({
        students: students.map(s => ({
            id: s._id.toString(),
            student_id: s.student_id,
            name: s.name,
            session_year: s.session_year,
        })),
    });
}
