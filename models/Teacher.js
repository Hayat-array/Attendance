import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const TeacherSchema = new mongoose.Schema({
    teacher_id: { type: String, maxlength: 20, required: true, unique: true },
    name: { type: String, maxlength: 100, required: true },
    password: { type: String, maxlength: 255, required: true },
    branch: { type: String, maxlength: 10, required: true },
    email: { type: String, maxlength: 120, unique: true, sparse: true },
    created_at: { type: Date, default: Date.now },
}, { collection: 'teachers' });

TeacherSchema.methods.checkPassword = function (plain) {
    return bcrypt.compareSync(plain, this.password);
};

export default mongoose.models.Teacher || mongoose.model('Teacher', TeacherSchema);
