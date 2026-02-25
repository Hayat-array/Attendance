import CredentialsProvider from 'next-auth/providers/credentials';
import { dbConnect } from '@/lib/db';
import Teacher from '@/models/Teacher';


export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                teacher_id: { label: 'Teacher ID', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                try {
                    await dbConnect();

                    // Allow login with either Teacher ID or Email
                    const teacher = await Teacher.findOne({
                        $or: [
                            { teacher_id: credentials.teacher_id },
                            { email: credentials.teacher_id.toLowerCase() }
                        ]
                    });

                    if (!teacher) {
                        console.log('[Auth] Teacher not found:', credentials.teacher_id);
                        return null;
                    }

                    const ok = teacher.checkPassword(credentials.password);
                    if (!ok) {
                        console.log('[Auth] Wrong password for:', credentials.teacher_id);
                        return null;
                    }

                    return {
                        id: teacher._id.toString(),
                        name: teacher.name,
                        email: teacher.email,
                        teacher_id: teacher.teacher_id,
                        branch: teacher.branch,
                    };
                } catch (e) {
                    console.error('[Auth] authorize error:', e.message);
                    return null;
                }
            },
        }),
    ],
    session: { strategy: 'jwt' },
    cookies: {
        sessionToken: {
            name: 'smart-attendance.session-token',
            options: { httpOnly: true, sameSite: 'lax', path: '/', secure: false },
        },
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.teacher_id = user.teacher_id;
                token.branch = user.branch;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.teacher_id = token.teacher_id;
                session.user.branch = token.branch;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
