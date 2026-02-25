'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

export default function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const htmlRef = useRef(null);

    useEffect(() => {
        htmlRef.current = document.documentElement;
        const saved = localStorage.getItem('sa_theme') || 'dark';
        htmlRef.current.dataset.theme = saved;
    }, []);

    function toggleTheme() {
        const current = htmlRef.current.dataset.theme;
        const next = current === 'dark' ? 'light' : 'dark';
        htmlRef.current.dataset.theme = next;
        localStorage.setItem('sa_theme', next);
    }

    const links = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/students', label: 'Students' },
        { href: '/attendance', label: 'Attendance' },
        { href: '/reports', label: 'Reports' },
    ];

    return (
        <header>
            <div className="header-inner">
                <Link href="/dashboard" className="logo">
                    <div className="logo-icon" style={{ background: 'linear-gradient(135deg, var(--accent), #1d4ed8)', padding: 6, borderRadius: 10, boxShadow: '0 0 15px var(--accent-glow)' }}>
                        <svg fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div>
                        <div className="logo-name">JECRC Attendance App</div>
                        <div className="logo-sub">College Portal <span style={{ opacity: 0.5 }}>— By Hayat Ali</span></div>
                    </div>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    </button>

                    <nav id="mainNav" className={open ? 'open' : ''}>
                        {links.map(l => (
                            <Link key={l.href} href={l.href} className={`nav-link${pathname.startsWith(l.href) ? ' active' : ''}`} onClick={() => setOpen(false)}>
                                {l.label}
                            </Link>
                        ))}
                        {session && (
                            <button className="nav-link nav-danger btn" style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 500 }}
                                onClick={() => signOut({ callbackUrl: '/login' })}>
                                Logout
                            </button>
                        )}
                    </nav>

                    <button className="hamburger" onClick={() => setOpen(!open)} aria-label="Menu">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
}
