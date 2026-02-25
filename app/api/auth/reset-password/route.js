import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Teacher from '@/models/Teacher';
import { verifyOtp } from '@/lib/otp';
import bcrypt from 'bcryptjs';

export async function POST(req) {
    try {
        await dbConnect();
        const { email, otp, password } = await req.json();
        if (!email || !otp || !password)
            return NextResponse.json({ error: 'All fields required' }, { status: 400 });
        if (password.length < 6)
            return NextResponse.json({ error: 'Password must be ≥6 chars' }, { status: 400 });

        const { success, message } = await verifyOtp(email.toLowerCase(), otp, 'password_reset');
        if (!success) return NextResponse.json({ error: message }, { status: 400 });

        const teacher = await Teacher.findOne({ email: email.toLowerCase() });
        if (!teacher) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
        teacher.password = bcrypt.hashSync(password, 10);
        await teacher.save();
        return NextResponse.json({ success: true, message: 'Password updated. Please log in.' });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
