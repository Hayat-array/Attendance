export function getAvailableSessions(count = 5) {
    const today = new Date();
    // Academic year starts in July (month 6)
    const startYear = today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;
    const sessions = [];
    for (let i = 0; i < count; i++) {
        const yearA = startYear + i;
        const yearB = String((yearA + 1) % 100).padStart(2, '0');
        sessions.push(`${yearA}-${yearB}`);
    }
    return sessions;
}

export function normalizeStatus(status) {
    if (!status) return null;
    const s = status.trim().toLowerCase();
    if (s === 'present' || s === 'p') return 'Present';
    if (s === 'absent' || s === 'a') return 'Absent';
    return null;
}
