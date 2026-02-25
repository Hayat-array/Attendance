import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subject: { type: String, maxlength: 100, required: true },
    semester: { type: Number, required: true },
    branch: { type: String, maxlength: 10, required: true },
    section: { type: String, maxlength: 5, required: true },
    session: { type: String, maxlength: 20, required: true },
    date: { type: Date, required: true },
    status: { type: String, maxlength: 10, required: true }, // "Present" | "Absent"
    taken_at: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
}, { collection: 'COLLEGE_ATTENDANCE' });

AttendanceSchema.index(
    { teacher: 1, student: 1, subject: 1, semester: 1, branch: 1, section: 1, session: 1, date: 1 },
    { unique: true }
);
AttendanceSchema.index({ teacher: 1, branch: 1, semester: 1, section: 1, subject: 1, date: 1 });
AttendanceSchema.index({ student: 1, date: 1 });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
