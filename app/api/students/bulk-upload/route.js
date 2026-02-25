import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Student from '@/models/Student';
import mongoose from 'mongoose';

// Valid branch names to detect if line[0] is a header
const BRANCHES = ['CSE', 'IT', 'ECE', 'ME', 'CE'];

// Known header aliases for each field (positional fallback: Roll, Name, Branch, Sem, Section, Session, Email, Phone)
const HEADER_MAP = {
    roll_no: ['roll_no', 'rollno', 'roll no', 'roll', 'student_id', 'id'],
    name: ['name', 'student_name', 'fullname', 'full name'],
    branch: ['branch', 'dept', 'department'],
    semester: ['semester', 'sem'],
    section: ['section', 'sec'],
    session_year: ['session_year', 'session', 'year', 'academic_year'],
    email: ['email', 'email_id', 'mail'],
    phone: ['phone', 'mobile', 'contact'],
};

function parseCSVLine(line) {
    // Handle quoted fields with commas inside
    const result = [];
    let cur = '', inQuote = false;
    for (const ch of line) {
        if (ch === '"') { inQuote = !inQuote; }
        else if (ch === ',' && !inQuote) { result.push(cur.trim()); cur = ''; }
        else { cur += ch; }
    }
    result.push(cur.trim());
    return result;
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await dbConnect();
        const teacherId = new mongoose.Types.ObjectId(session.user.id);

        const { csvData } = await req.json();
        if (!csvData?.trim()) return NextResponse.json({ error: 'No data provided' }, { status: 400 });

        const rawLines = csvData.trim().split('\n').filter(l => l.trim());
        if (!rawLines.length) return NextResponse.json({ error: 'No data provided' }, { status: 400 });

        // Auto-detect if first line is a header (contains non-branch/non-numeric text in first col)
        const firstParts = parseCSVLine(rawLines[0]);
        const firstColUpper = firstParts[0]?.trim().toUpperCase();
        const hasHeader = !BRANCHES.includes(firstColUpper) && isNaN(firstColUpper.replace(/[^0-9]/g, '').slice(0, 2));

        let headerIndices = null;
        let dataLines = rawLines;

        if (hasHeader) {
            // Map header names to field keys
            const rawHeaders = firstParts.map(h => h.trim().toLowerCase());
            headerIndices = {};
            for (const [field, aliases] of Object.entries(HEADER_MAP)) {
                const idx = rawHeaders.findIndex(h => aliases.includes(h));
                headerIndices[field] = idx; // -1 if not found
            }
            dataLines = rawLines.slice(1);
        }

        const results = { success: 0, skipped: 0, failed: 0, errors: [] };

        for (const line of dataLines) {
            if (!line.trim()) continue;
            const parts = parseCSVLine(line);
            if (parts.length < 3) continue;

            let sid, name, branch, sem, sec, sess, email, phone;

            if (headerIndices) {
                // Named column mode
                const g = (field) => headerIndices[field] >= 0 ? (parts[headerIndices[field]] || '').trim() : '';
                sid = g('roll_no');
                name = g('name');
                branch = g('branch').toUpperCase();
                sem = g('semester');
                sec = g('section').toUpperCase();
                sess = g('session_year');
                email = g('email').toLowerCase();
                phone = g('phone');
            } else {
                // Positional mode: Roll, Name, Branch, Sem, Section, Session, Email, Phone
                [sid, name, branch, sem, sec, sess, email = '', phone = ''] = parts;
                branch = (branch || '').toUpperCase();
                sec = (sec || '').toUpperCase();
                email = (email || '').toLowerCase();
            }

            if (!sid || !name || !branch || !sem || !sec || !sess) {
                results.failed++;
                results.errors.push(`Row missing critical data: ${line}`);
                continue;
            }

            try {
                await Student.findOneAndUpdate(
                    { student_id: sid },
                    {
                        $set: {
                            student_id: sid,
                            name,
                            branch,
                            semester: parseInt(sem),
                            section: sec,
                            session_year: sess,
                            ...(email && { email }),
                            ...(phone && { phone }),
                        },
                        $addToSet: { teachers: teacherId },
                    },
                    { upsert: true, new: true }
                );
                results.success++;
            } catch (err) {
                results.failed++;
                results.errors.push(`Error for ${sid}: ${err.message}`);
            }
        }

        if (results.success === 0 && results.failed === 0) {
            return NextResponse.json({ error: 'No valid rows found. Check your CSV format.' }, { status: 400 });
        }

        return NextResponse.json({ success: true, ...results });
    } catch (err) {
        console.error('[Bulk Upload] Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
