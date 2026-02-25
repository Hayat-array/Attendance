import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Attendance from '@/models/Attendance';
import Teacher from '@/models/Teacher';
import mongoose from 'mongoose';

function buildQuery(teacherId, filters) {
    const q = { teacher: new mongoose.Types.ObjectId(teacherId) };
    if (filters.branch) q.branch = filters.branch;
    if (filters.session) q.session = filters.session;
    if (filters.semester) q.semester = parseInt(filters.semester);
    if (filters.section) q.section = filters.section;
    if (filters.subject) q.subject = filters.subject;
    if (filters.month) {
        const [y, m] = filters.month.split('-').map(Number);
        q.date = { $gte: new Date(y, m - 1, 1), $lt: m === 12 ? new Date(y + 1, 0, 1) : new Date(y, m, 1) };
    } else {
        if (filters.start_date) q.date = { ...q.date, $gte: new Date(filters.start_date) };
        if (filters.end_date) q.date = { ...q.date, $lte: new Date(filters.end_date) };
    }
    return q;
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export async function GET(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await dbConnect();

        const resolvedParams = await params;
        const { format } = resolvedParams;
        const sp = new URL(req.url).searchParams;
        const filters = {
            branch: sp.get('branch') || '',
            session: sp.get('session') || '',
            semester: sp.get('semester') || '',
            section: sp.get('section') || '',
            subject: sp.get('subject') || '',
            month: sp.get('month') || '',
            start_date: sp.get('start_date') || '',
            end_date: sp.get('end_date') || '',
        };

        // Fetch teacher from DB to get teacher_id and full name
        const teacher = await Teacher.findById(session.user.id).lean();
        const teacherName = teacher?.name || session.user.name || 'Unknown';
        const teacherId = teacher?.teacher_id || session.user.teacher_id || 'N/A';

        const query = buildQuery(session.user.id, filters);
        const records = await Attendance.find(query)
            .populate('student', 'student_id name')
            .sort({ date: 1 })
            .lean();

        if (format === 'csv') {
            // Determine year/month from filter or from records
            let year, month, monthName;
            if (filters.month) {
                const [y, m] = filters.month.split('-').map(Number);
                year = y;
                month = m - 1; // 0-indexed
                monthName = MONTH_NAMES[month];
            } else if (records.length) {
                const firstDate = new Date(records[0].date);
                year = firstDate.getFullYear();
                month = firstDate.getMonth();
                monthName = MONTH_NAMES[month];
            } else {
                // No records and no month filter
                const now = new Date();
                year = now.getFullYear();
                month = now.getMonth();
                monthName = MONTH_NAMES[month];
            }

            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const dayNums = Array.from({ length: daysInMonth }, (_, i) => i + 1);
            const dayNames = dayNums.map(d =>
                new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(year, month, d))
            );

            // Pivot: studentKey -> { day: 'P'|'A' }
            const studentMap = {};
            records.forEach(r => {
                const date = new Date(r.date);
                if (date.getFullYear() === year && date.getMonth() === month) {
                    const roll = r.student?.student_id || 'N/A';
                    const name = r.student?.name || 'Unknown';
                    const key = `${roll}|||${name}`;
                    if (!studentMap[key]) studentMap[key] = { roll, name, days: {} };
                    studentMap[key].days[date.getDate()] = r.status === 'Present' ? 'P' : 'A';
                }
            });

            // ──────────────────────────────────────────
            // Build CSV — each header info on its own row
            // ──────────────────────────────────────────
            let csv = '';

            // Row 1: Title
            csv += `SMART ATTENDANCE SYSTEM - MONTHLY REGISTER\n`;

            // Row 2: Teacher info
            csv += `Teacher ID:,${teacherId},Teacher Name:,${teacherName}\n`;

            // Row 3: Class info
            csv += `Branch:,${filters.branch || 'All'},Session:,${filters.session || 'All'},Sem:,${filters.semester || 'All'},Section:,${filters.section || 'All'}\n`;

            // Row 4: Subject + Month
            csv += `Subject:,${filters.subject || 'All'},Month:,${monthName},Year:,${year}\n`;

            // Row 5: blank separator
            csv += `\n`;

            // Row 6: Column headers — Roll No, Name, Month label, day numbers, totals
            csv += `Roll No,Student Name,Month,` + dayNums.join(',') + `,Total P,Total A,%\n`;

            // Row 7: Day names row
            csv += `,,Day,` + dayNames.join(',') + `,,,\n`;

            // Data rows
            if (Object.keys(studentMap).length === 0) {
                csv += `"No attendance records found for the selected filters."\n`;
            } else {
                Object.values(studentMap)
                    .sort((a, b) => a.roll.localeCompare(b.roll))
                    .forEach(({ roll, name, days }) => {
                        let pCount = 0, aCount = 0;
                        const dayCells = dayNums.map(d => {
                            const s = days[d] || '-';
                            if (s === 'P') pCount++;
                            else if (s === 'A') aCount++;
                            return s;
                        });
                        const total = pCount + aCount;
                        const pct = total > 0 ? ((pCount / total) * 100).toFixed(1) + '%' : '0%';
                        csv += `"${roll}","${name}","${monthName}",${dayCells.join(',')},${pCount},${aCount},${pct}\n`;
                    });
            }

            // Footer
            csv += `\n`;
            csv += `Generated on:,${new Date().toLocaleString('en-IN')}\n`;
            csv += `Exported by:,${teacherName} (${teacherId})\n`;

            return new Response('\ufeff' + csv, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename=attendance_${filters.branch || 'all'}_sem${filters.semester || 'X'}_sec${filters.section || 'X'}_${monthName}_${year}.csv`
                }
            });
        }

        if (format === 'txt') {
            let txt = 'SMART ATTENDANCE SYSTEM - ATTENDANCE REPORT\n';
            txt += '='.repeat(50) + '\n\n';
            txt += `Teacher ID  : ${teacherId}\n`;
            txt += `Teacher Name: ${teacherName}\n`;
            txt += `Branch      : ${filters.branch || 'All'}\n`;
            txt += `Semester    : ${filters.semester || 'All'}\n`;
            txt += `Section     : ${filters.section || 'All'}\n`;
            txt += `Subject     : ${filters.subject || 'All'}\n`;
            txt += `Session     : ${filters.session || 'All'}\n`;
            txt += '\n' + '-'.repeat(80) + '\n';
            txt += 'Date       | Roll No    | Name                 | Subject            | Status\n';
            txt += '-'.repeat(80) + '\n';
            records.forEach(r => {
                const d = new Date(r.date).toLocaleDateString('en-IN').padEnd(10);
                const rid = (r.student?.student_id || '').padEnd(10);
                const nm = (r.student?.name || '').padEnd(20);
                const sub = (r.subject || '').padEnd(18);
                txt += `${d} | ${rid} | ${nm} | ${sub} | ${r.status}\n`;
            });
            txt += '\n' + '='.repeat(50) + '\n';
            txt += `Total Records : ${records.length}\n`;
            txt += `Generated on  : ${new Date().toLocaleString('en-IN')}\n`;

            return new Response(txt, {
                headers: {
                    'Content-Type': 'text/plain',
                    'Content-Disposition': `attachment; filename=attendance_report_${Date.now()}.txt`
                }
            });
        }

        return NextResponse.json({ error: 'Unsupported format.' }, { status: 400 });
    } catch (e) {
        console.error('[API Export] Error:', e.message);
        return NextResponse.json({ error: 'Export failed: ' + e.message }, { status: 500 });
    }
}
