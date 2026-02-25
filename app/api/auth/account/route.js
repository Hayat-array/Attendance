import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Teacher from '@/models/Teacher';
import Attendance from '@/models/Attendance';

export async function DELETE(req) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const teacherId = session.user.id;

        // Delete all attendance records created by this teacher
        await Attendance.deleteMany({ teacher: teacherId });

        // Delete the teacher account
        await Teacher.findByIdAndDelete(teacherId);

        return NextResponse.json({ success: true, message: 'Account deleted successfully.' });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
