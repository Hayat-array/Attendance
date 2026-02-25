import mongoose from 'mongoose';

const SubjectSchema = new mongoose.Schema({
    code: { type: String, maxlength: 64, required: true, unique: true },
    name: { type: String, maxlength: 100, required: true },
    branch: { type: String, maxlength: 10, required: true },
    semester: { type: Number, required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
}, { collection: 'subjects' });

SubjectSchema.index({ teacher: 1, branch: 1, semester: 1 });

export default mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);
