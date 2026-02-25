import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Teacher from '@/models/Teacher';
import { verifyOtp } from '@/lib/otp';
import bcrypt from 'bcryptjs';

export async function POST(req) {
    try {
        await dbConnect();
        const { name, email, branch, password, otp } = await req.json();
        const { success, message } = await verifyOtp(email.toLowerCase(), otp, 'signup');
        if (!success) return NextResponse.json({ error: message }, { status: 400 });

        // Generate automatic teacher_id (numeric sort to handle T9 < T10 correctly)
        const allTeachers = await Teacher.find({}, 'teacher_id').lean();
        const maxNum = allTeachers.reduce((max, t) => {
            if (t.teacher_id && t.teacher_id.startsWith('T')) {
                const num = parseInt(t.teacher_id.substring(1), 10);
                return isNaN(num) ? max : Math.max(max, num);
            }
            return max;
        }, 0);
        const nextId = `T${String(maxNum + 1).padStart(3, '0')}`;

        const hash = bcrypt.hashSync(password, 10);
        await Teacher.create({ teacher_id: nextId, name, email: email.toLowerCase(), branch, password: hash });
        return NextResponse.json({ success: true, message: `Account created! Your ID is ${nextId}. Please log in.` });
    } catch (e) {
        if (e.code === 11000) return NextResponse.json({ error: 'Teacher ID or email already taken.' }, { status: 409 });
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
