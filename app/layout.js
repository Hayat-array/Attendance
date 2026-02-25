import { Inter } from 'next/font/google';
import './globals.css';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'JECRC Attendance App — By Hayat Ali',
  description: 'Premium College Attendance Management System for JECRC, created by Hayat Ali',
};

export default async function RootLayout({ children }) {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (_) {
    // Stale / invalid cookie — treat user as unauthenticated
  }
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
