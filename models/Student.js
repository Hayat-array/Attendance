import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
    student_id: { type: String, maxlength: 30, required: true, unique: true },
    name: { type: String, maxlength: 100, required: true },
    branch: { type: String, maxlength: 10, required: true },
    class_name: { type: String, maxlength: 50 },
    semester: { type: Number, required: true },
    section: { type: String, maxlength: 5, required: true },
    session_year: { type: String, maxlength: 20, required: true },
    email: { type: String, maxlength: 120 },
    phone: { type: String, maxlength: 15 },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
    added_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    created_at: { type: Date, default: Date.now },
}, { collection: 'students' });

StudentSchema.index({ teachers: 1, branch: 1, semester: 1, section: 1 });

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);
