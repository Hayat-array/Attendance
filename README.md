<<<<<<< HEAD
# Attendance
=======
# 📋 Smart Attendance System — Next.js

A high-performance, professional **College Attendance Management System** built with **Next.js 16**, **MongoDB (Mongoose)**, and **NextAuth.js**. This portal allows teachers to manage their students, record daily attendance with a modern UI, and generate detailed analytics reports.

---

## 🚀 Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Backend** | Node.js with Next.js Route Handlers |
| **Database** | MongoDB via Mongoose 9 |
| **Authentication** | NextAuth.js v4 (JWT + Credentials) |
| **Security** | bcryptjs (Password Hashing) |
| **Email/OTP** | Nodemailer (Gmail SMTP Integration) |
| **UI/UX** | Vanilla CSS3 (Modern Glassmorphism & Responsive Design) |

---

## ✨ Key Features & Functionality

### 1. Teacher Portal (Auth & Security)
- **Secure Registration**: Signup with email-based OTP verification.
- **Auto-ID Generation**: Teachers are automatically assigned a unique ID (e.g., `T001`, `T002`) upon account verification.
- **Account Self-Deletion**: Teachers can permanently delete their account and all associated records by typing `DELETE` in a confirmation prompt.
- **JWT Sessions**: Secure login with "Remember Me" functionality.

### 2. Multi-Mode Student Management
- **Individual Enrollment**: Add students manually with full details (Roll No, Name, Branch, etc.).
- **Professional Bulk Upload**: 
    - **Smart CSV Parsing**: Drag-and-drop file picker that supports any CSV/Text format.
    - **Header-Agnostic**: Automatically detects if a header exists; supports positional parsing if headers are missing.
    - **Upsert Logic**: Automatically adds new students or updates existing ones based on Roll Number.
- **Protected Deletion**: To prevent data loss, deleting a student requires typing their **specific Roll Number** to confirm.

### 3. Smart Attendance Interface
- **Bubble UI**: A fast, mobile-friendly interface to toggle student presence (P/A).
- **Duplicate Protection**: Backend prevents double-marking for the same student/subject on the same date.
- **Edit Mode**: Re-opening an existing class session automatically loads the previous data for quick editing.

### 4. Advanced Analytics & Reports
- **Reports Dashboard**: 
    - **Overview**: Subject-wise breakdown and monthly attendance trends.
    - **Low Attendance Alerts**: Real-time identification of students below a 75% threshold.
    - **Monthly Register**: A full grid view displaying attendance for the entire month at a glance.
- **Multi-Format Export**: Download reports as **CSV**, **TXT**, or **Excel-ready Register Style**.

---

## 📁 Detailed Project Structure

```bash
attendance-next/
├── app/
│   ├── api/                     # Server-side API logic
│   │   ├── auth/                # Signup, OTP, and Login routes
│   │   ├── students/            # Student CRUD and Bulk Upload
│   │   ├── attendance/          # Attendance capture and retrieval
│   │   └── reports/             # Analytics and Export generation
│   ├── attendance/              # Front-end: Attendance marking UI
│   ├── dashboard/               # Front-end: Teacher stats & quick alerts
│   ├── login/                   # Front-end: Secure sign-in portal
│   ├── reports/                 # Front-end: Detailed analysis and grids
│   └── students/                # Front-end: Student list and CSV import
├── components/                  # Global Navbar and State Providers
├── lib/                         # Core utilities: DB connection, Auth config, OTP logic
├── models/                      # MongoDB Schemas (Teacher, Student, Attendance, Subject)
└── README.md                    # Project documentation
```

---

## 🛠️ Installation & Setup

### 1. Requirements
- Node.js 18+
- MongoDB (Local or Atlas)
- Gmail account (for OTP emails)

### 2. Environment Setup
Create a `.env.local` file:
```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_random_string
EMAIL_SENDER=your_gmail_address
EMAIL_PASSWORD=your_gmail_app_password
OTP_EXPIRY_MINUTES=5
```

### 3. Run Locally
```bash
git clone https://github.com/Hayat-array/Attendance.git
cd Attendance
npm install
npm run dev
```

---

## 📊 Business Logic Summary
- **Attendance Percentage** = (Present Days / Total Days) * 100.
- **Roll Numbers** serve as unique identifiers for students.
- **Teacher IDs** serve as unique identifiers for accounts.
- **Academic Sessions** (e.g., 2025-26) are dynamically calculated based on the current date.

---

## 📄 License
**Smart Attendance System** © 2026 — College Management Portal. All rights reserved. Registered for use by **Hayat Ali**.
>>>>>>> d1fee2f (Initialize Smart Attendance System v1.0.0)
