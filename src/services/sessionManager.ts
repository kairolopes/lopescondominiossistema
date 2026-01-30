
export interface SessionData {
  step: string;
  data?: any;
  tags: string[];
  history: { role: 'user' | 'bot', content: string, timestamp: Date }[];
  phone: string;
}

const sessions = new Map<string, SessionData>();

export const sessionManager = {
    getSession: (phone: string) => sessions.get(phone),
    
    createSession: (phone: string) => {
        const session: SessionData = { 
            step: 'START', 
            tags: ['novo_contato'], 
            history: [], 
            phone 
        };
        sessions.set(phone, session);
        return session;
    },

    deleteSession: (phone: string) => sessions.delete(phone),

    getAllSessions: () => Array.from(sessions.values()),

    addTag: (phone: string, tag: string) => {
        const session = sessions.get(phone);
        if (session && !session.tags.includes(tag)) {
            session.tags.push(tag);
        }
    },

    // Helper for testing
    _reset: () => sessions.clear()
};
