import { db } from '../config/firebase';

interface Session {
    phone: string;
    name: string;
    state: string;
    lastActivity: Date;
    pausedAt?: Date; // New field to track pause start time
    data: any;
}

const sessions: Map<string, Session> = new Map();

export const sessionManager = {
    getSession: (phone: string) => sessions.get(phone),
    
    ensureSession: async (phone: string, name: string) => {
        // 1. Check Memory
        if (sessions.has(phone)) {
            const session = sessions.get(phone)!;
            // Check for auto-resume in memory
            if (session.state === 'PAUSED' && session.pausedAt) {
                const diffMinutes = (new Date().getTime() - session.pausedAt.getTime()) / (1000 * 60);
                if (diffMinutes > 20) {
                    console.log(`[SessionManager] Auto-resuming session for ${phone} (Paused for ${diffMinutes.toFixed(0)}m)`);
                    session.state = 'IDLE';
                    session.pausedAt = undefined;
                    // Sync with DB
                    if (db) {
                         await db.collection('conversations').doc(phone).set({ 
                            status: 'active',
                            pausedAt: null
                        }, { merge: true });
                    }
                }
            }
            return session;
        }

        // 2. Check Database (Conversations)
        if (db) {
            try {
                const doc = await db.collection('conversations').doc(phone).get();
                if (doc.exists) {
                    const data = doc.data();
                    let state = data?.status === 'paused' ? 'PAUSED' : 'IDLE';
                    let pausedAt = data?.pausedAt?.toDate ? data.pausedAt.toDate() : (data?.pausedAt ? new Date(data.pausedAt) : undefined);

                    // Auto-Resume Logic on Restoration
                    if (state === 'PAUSED') {
                        // If no pausedAt found but is paused, assume lastActivity as fallback
                        const effectivePausedTime = pausedAt || (data?.lastActivity?.toDate ? data.lastActivity.toDate() : new Date());
                        const diffMinutes = (new Date().getTime() - effectivePausedTime.getTime()) / (1000 * 60);

                        console.log(`[SessionManager] Session ${phone} is PAUSED. Duration: ${diffMinutes.toFixed(1)}m (Threshold: 20m)`);

                        if (diffMinutes > 20) {
                            console.log(`[SessionManager] Auto-resuming restored session for ${phone} (Paused for ${diffMinutes.toFixed(0)}m)`);
                            state = 'IDLE';
                            pausedAt = undefined;
                            // Update DB immediately
                            await db.collection('conversations').doc(phone).set({ 
                                status: 'active',
                                pausedAt: null
                            }, { merge: true });
                        }
                    }

                    const session: Session = {
                        phone,
                        name: data?.senderName || name,
                        state,
                        lastActivity: data?.lastActivity?.toDate ? data.lastActivity.toDate() : new Date(),
                        pausedAt,
                        data: {} 
                    };
                    sessions.set(phone, session);
                    console.log(`[SessionManager] Restored session for ${phone} from DB (State: ${session.state})`);
                    return session;
                }
            } catch (err) {
                console.error('[SessionManager] Error restoring session:', err);
            }
        }

        // 3. Create New
        return sessionManager.createSession(phone, name);
    },

    createSession: (phone: string, name: string) => {
        const session: Session = {
            phone,
            name,
            state: 'IDLE',
            lastActivity: new Date(),
            data: {}
        };
        sessions.set(phone, session);
        return session;
    },

    updateState: (phone: string, state: string, data: any = {}) => {
        const session = sessions.get(phone);
        if (session) {
            session.state = state;
            session.lastActivity = new Date();
            if (state === 'PAUSED') {
                session.pausedAt = new Date();
            } else {
                session.pausedAt = undefined;
            }
            session.data = { ...session.data, ...data };
            sessions.set(phone, session);
        }
    }
};
