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
