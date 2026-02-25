import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Teacher from '@/models/Teacher';
import { createOtp } from '@/lib/otp';

export async function POST(req) {
    try {
        await dbConnect();
        const { email } = await req.json();
        const teacher = await Teacher.findOne({ email: email?.toLowerCase() });
        // Always say "sent" to prevent email enumeration
        if (teacher) {
            await createOtp(email.toLowerCase(), 'password_reset');
        }
        return NextResponse.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
