import { dbConnect } from './lib/db.js';
import Student from './models/Student.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function check() {
    await dbConnect();
    const count = await Student.countDocuments();
    const sample = await Student.findOne().lean();
    console.log('Total students:', count);
    console.log('Sample student:', JSON.stringify(sample, null, 2));

    // Check if any student lacks the teachers field
    const withoutTeachers = await Student.countDocuments({ teachers: { $exists: false } });
    console.log('Students without teachers field:', withoutTeachers);

    process.exit();
}

check();
