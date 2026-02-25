import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Subject from '@/models/Subject';
import mongoose from 'mongoose';

export async function GET(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await dbConnect();

        const resolvedParams = await params;
        const { branch, semester } = resolvedParams;
        const sem = parseInt(semester);

        if (!branch || isNaN(sem)) {
            return NextResponse.json({ subjects: [] });
        }

        const teacherId = new mongoose.Types.ObjectId(session.user.id);

        // Only return subjects that belong to THIS teacher for this branch+semester
        // Teachers see only their own subjects — full data isolation
        const subjects = await Subject.find({
            teacher: teacherId,
            branch,
            semester: sem,
        }).sort({ name: 1 });

        return NextResponse.json({
            subjects: subjects.map(s => ({ _id: s._id.toString(), name: s.name, code: s.code }))
        });
    } catch (e) {
        console.error('[API Subject Fetch] Error:', e.message);
        return NextResponse.json({ error: 'Failed to fetch subjects', details: e.message }, { status: 500 });
    }
}
