import { dbConnect } from './lib/db.js';
import Student from './models/Student.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function test() {
    await dbConnect();
    console.log('Connected');
    try {
        const testId = 'TEST_' + Date.now();
        const s = await Student.findOneAndUpdate(
            { student_id: testId },
            {
                $set: {
                    name: 'Test Student',
                    branch: 'CSE',
                    semester: 1,
                    section: 'A',
                    session_year: '2023-27'
                },
                $addToSet: { teachers: new mongoose.Types.ObjectId() }
            },
            { upsert: true, new: true }
        );
        console.log('Success:', s);
        await Student.deleteOne({ student_id: testId });
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit();
}

test();
