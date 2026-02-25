import nodemailer from 'nodemailer';
import { dbConnect } from './db.js';
import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    purpose: { type: String, required: true },
    expires_at: { type: Date, required: true },
    used: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
});
OtpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
OtpSchema.index({ email: 1 });

function getOtpModel() {
    return mongoose.models.OtpCode || mongoose.model('OtpCode', OtpSchema, 'otp_codes');
}

function generateOtp(length = 6) {
    let otp = '';
    for (let i = 0; i < length; i++) otp += Math.floor(Math.random() * 10);
    return otp;
}

async function sendEmail(receiver, otp, purpose) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: process.env.EMAIL_SENDER, pass: process.env.EMAIL_PASSWORD },
    });

    let subject, text;
    const expiry = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');
    if (purpose === 'signup') {
        subject = 'Verify Your Email – Smart Attendance';
        text = `Welcome to Smart Attendance!\n\nYour verification code is: ${otp}\n\nThis code will expire in ${expiry} minutes.\n\nIf you didn't request this, please ignore this email.`;
    } else if (purpose === 'password_reset') {
        subject = 'Password Reset – Smart Attendance';
        text = `You requested a password reset.\n\nYour reset code is: ${otp}\n\nThis code will expire in ${expiry} minutes.\n\nIf you didn't request this, please ignore this email.`;
    } else {
        subject = 'Your OTP Code';
        text = `Your OTP is: ${otp}\nValid for ${expiry} minutes.`;
    }

    await transporter.sendMail({ from: process.env.EMAIL_SENDER, to: receiver, subject, text });
}

export async function createOtp(email, purpose = 'general') {
    await dbConnect();
    const OtpCode = getOtpModel();
    email = email.trim().toLowerCase();
    const otp = generateOtp();
    const expiry = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');
    const expires_at = new Date(Date.now() + expiry * 60 * 1000);
    await OtpCode.deleteMany({ email, purpose });
    await OtpCode.create({ email, otp, purpose, expires_at, used: false });
    await sendEmail(email, otp, purpose);
    return otp;
}

export async function verifyOtp(email, otp, purpose = 'general') {
    await dbConnect();
    const OtpCode = getOtpModel();
    email = email.trim().toLowerCase();
    otp = otp.trim();
    const record = await OtpCode.findOne({
        email, purpose, used: false,
        expires_at: { $gt: new Date() },
    });
    if (!record) return { success: false, message: 'Invalid or expired OTP.' };
    if (otp !== record.otp) return { success: false, message: 'Incorrect OTP.' };
    await OtpCode.deleteOne({ _id: record._id });
    return { success: true, message: 'OTP verified successfully.' };
}
