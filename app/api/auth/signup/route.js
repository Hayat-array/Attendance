import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Teacher from '@/models/Teacher';
import Subject from '@/models/Subject';
import { createOtp } from '@/lib/otp';

const BRANCHES = ['CSE', 'IT', 'ECE', 'ME', 'CE'];
const DEFAULT_SUBJECTS = {
    CSE: {
        1: ['Programming in C', 'Mathematics I', 'Digital Logic'],
        2: ['Data Structures', 'Mathematics II', 'OOP'],
        3: ['DBMS', 'Operating Systems', 'Computer Networks'],
        4: ['Algorithms', 'Software Engineering', 'Web Technology'],
        5: ['Machine Learning', 'Compiler Design', 'Cloud Computing'],
        6: ['Distributed Systems', 'Cyber Security', 'Data Mining'],
        7: ['Major Project I', 'AI', 'Elective I'],
        8: ['Major Project II', 'Elective II', 'Seminar'],
    },
    IT: {
        1: ['Problem Solving', 'Mathematics I', 'Physics'],
        2: ['Data Structures', 'Mathematics II', 'Computer Organization'],
        3: ['DBMS', 'Operating Systems', 'Java Programming'],
        4: ['Computer Networks', 'Web Development', 'Mobile Computing'],
    },
    ECE: {
        1: ['Basic Electronics', 'Mathematics I', 'Physics'],
        2: ['Signals and Systems', 'Network Theory', 'Digital Circuits'],
        3: ['Analog Electronics', 'Microprocessors', 'Control Systems'],
        4: ['Communication Systems', 'VLSI', 'Embedded Systems'],
    },
    ME: {
        1: ['Engineering Mechanics', 'Mathematics I', 'Physics'],
        2: ['Thermodynamics', 'Mathematics II', 'Workshop Technology'],
    },
    CE: {
        1: ['Engineering Drawing', 'Mathematics I', 'Chemistry'],
        2: ['Strength of Materials', 'Surveying', 'Fluid Mechanics'],
    },
};

async function seedSubjects() {
    const count = await Subject.countDocuments();
    if (count > 0) return;
    for (const [branch, semMap] of Object.entries(DEFAULT_SUBJECTS)) {
        for (const [sem, names] of Object.entries(semMap)) {
            for (let i = 0; i < names.length; i++) {
                const code = `${branch}${sem}${String(i + 1).padStart(2, '0')}`;
                await Subject.findOneAndUpdate({ code }, { code, name: names[i], branch, semester: parseInt(sem), teacher: null }, { upsert: true });
            }
        }
    }
}


export async function GET() {
    try {
        await dbConnect();
        await seedSubjects();
        return NextResponse.json({ message: 'DB seeded' });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const { name, email, branch, password } = await req.json();
        if (!name || !email || !password || !branch)
            return NextResponse.json({ error: 'All fields required' }, { status: 400 });
        if (!BRANCHES.includes(branch))
            return NextResponse.json({ error: 'Invalid branch' }, { status: 400 });
        if (password.length < 6)
            return NextResponse.json({ error: 'Password must be ≥6 chars' }, { status: 400 });
        if (await Teacher.findOne({ email: email.toLowerCase() }))
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

        await createOtp(email.toLowerCase(), 'signup');
        return NextResponse.json({ success: true, message: 'OTP sent to your email' });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
