import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import mongoose from 'mongoose';

export async function DELETE(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const resolvedParams = await params;
    const teacherId = new mongoose.Types.ObjectId(session.user.id);
    const s = await Student.findOne({
        _id: resolvedParams.id,
        $or: [
            { teachers: teacherId },
            { added_by: teacherId }
        ]
    });
    if (!s) return NextResponse.json({ error: 'Student not found or unauthorized.' }, { status: 404 });

    // Instead of deleting the student completely, we should maybe just remove the teacher link?
    // But the user asked for deletion. If many teachers share a student, deleting them completely might be bad.
    // However, the current app behavior is one-student-one-class usually.
    // Let's stick to deletion for now as requested by the original logic.
    await Attendance.deleteMany({ student: s._id, teacher: teacherId });
    await s.deleteOne();
    return NextResponse.json({ success: true });
}
