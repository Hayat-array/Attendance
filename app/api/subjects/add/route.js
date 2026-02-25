import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Subject from '@/models/Subject';
import mongoose from 'mongoose';

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await dbConnect();

        const { name, branch, semester } = await req.json();
        if (!name || !branch || !semester)
            return NextResponse.json({ success: false, message: 'All fields required.' }, { status: 400 });

        const sem = parseInt(String(semester).replace(/\D/g, ''));
        if (!sem) return NextResponse.json({ success: false, message: 'Invalid semester.' }, { status: 400 });

        const teacherId = new mongoose.Types.ObjectId(session.user.id);
        const trimmedName = name.trim();

        // Only block exact duplicate subject name for same teacher+branch+semester
        const duplicate = await Subject.findOne({
            teacher: teacherId,
            branch,
            semester: sem,
            name: { $regex: `^${trimmedName}$`, $options: 'i' }
        });
        if (duplicate)
            return NextResponse.json({ success: false, message: `Subject '${trimmedName}' already exists for this class.` }, { status: 400 });

        // Generate unique code per subject
        const clean = trimmedName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
        const code = `${branch}-${sem}-${clean}-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
        const created = await Subject.create({ code, name: trimmedName, branch, semester: sem, teacher: teacherId });

        return NextResponse.json({ success: true, message: `Subject '${trimmedName}' added successfully!`, subject: { _id: created._id, name: created.name } });
    } catch (e) {
        console.error('[API Subject Add]', e.message);
        return NextResponse.json({ success: false, message: 'Server error: ' + e.message }, { status: 500 });
    }
}
