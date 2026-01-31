import { db } from '../config/firebase';

interface Session {
    phone: string;
    name: string;
    state: string;
    lastActivity: Date;
    data: any;
}

const sessions: Map<string, Session> = new Map();

export const sessionManager = {
    getSession: (phone: string) => sessions.get(phone),
    
    ensureSession: async (phone: string, name: string) => {
        // 1. Check Memory
        if (sessions.has(phone)) return sessions.get(phone)!;

        // 2. Check Database (Conversations)
        if (db) {
            try {
                const doc = await db.collection('conversations').doc(phone).get();
                if (doc.exists) {
                    const data = doc.data();
                    const session: Session = {
                        phone,
                        name: data?.senderName || name,
                        state: data?.status === 'paused' ? 'PAUSED' : 'IDLE', // Resuming from DB
                        lastActivity: data?.lastActivity?.toDate ? data.lastActivity.toDate() : new Date(),
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
        const session = {
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
            session.data = { ...session.data, ...data };
            sessions.set(phone, session);
        }
    }
};
