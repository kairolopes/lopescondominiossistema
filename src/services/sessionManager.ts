import { db } from '../config/firebase';

interface Session {
    phone: string;
    name: string;
    profilePicUrl?: string; // WhatsApp profile picture
    state: string;
    lastActivity: Date;
    pausedAt?: Date; // New field to track pause start time
    data: any;
}

const sessions: Map<string, Session> = new Map();

export const sessionManager = {
    getSession: (phone: string) => sessions.get(phone),
    
    ensureSession: async (phone: string, name: string, profilePicUrl?: string) => {
        // 1. Check Memory
        if (sessions.has(phone)) {
            const session = sessions.get(phone)!;
            
            // Update profile info if changed
            let updated = false;
            if (name && session.name !== name) {
                session.name = name;
                updated = true;
            }
            if (profilePicUrl && session.profilePicUrl !== profilePicUrl) {
                session.profilePicUrl = profilePicUrl;
                updated = true;
            }

            // Sync updates to DB
            if (updated && db) {
                 await db.collection('conversations').doc(phone).set({ 
                    senderName: session.name,
                    profilePicUrl: session.profilePicUrl
                }, { merge: true });
            }

            // Check for auto-resume in memory
            if (session.state === 'PAUSED') {
                const effectivePausedTime = session.pausedAt || new Date(0); // Epoch 0 if undefined
                const diffMinutes = (new Date().getTime() - effectivePausedTime.getTime()) / (1000 * 60);
                
                // Aggressive auto-resume (same as DB logic)
                if (diffMinutes > 20 || diffMinutes < 1.0 || isNaN(diffMinutes)) {
                    console.log(`[SessionManager] Auto-resuming MEMORY session for ${phone} (Reason: Duration ${diffMinutes.toFixed(1)}m)`);
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
                    // Fix: If pausedAt is missing in DB, do NOT default to new Date() because it resets duration to 0.
                    // Instead, default to a past date to force check or keep it undefined to signal "unknown start".
                    // However, we used new Date() before which caused "Duration: 0.0m".
                    let pausedAt = data?.pausedAt?.toDate ? data.pausedAt.toDate() : (data?.pausedAt ? new Date(data.pausedAt) : undefined);

                    // Auto-Resume Logic on Restoration
                    // CRITICAL FIX: If user complains about "never pause", we should be aggressive.
                    // If we found 'PAUSED' in DB but user says it keeps pausing, maybe the DB has bad state.
                    // Let's implement a hard override: If duration > 20m OR pausedAt is invalid/missing/suspiciously recent (0.0m on boot), UNPAUSE.
                    
                    if (state === 'PAUSED') {
                        // If no pausedAt found but is paused, assume it was paused a long time ago (force resume)
                        // Or use lastActivity.
                        const effectivePausedTime = pausedAt || (data?.lastActivity?.toDate ? data.lastActivity.toDate() : new Date(0)); // Epoch 0 to force large diff
                        
                        // Calculate minutes since pause
                        const diffMinutes = (new Date().getTime() - effectivePausedTime.getTime()) / (1000 * 60);

                        console.log(`[SessionManager] Session ${phone} is PAUSED. Duration: ${diffMinutes.toFixed(1)}m (Threshold: 20m)`);

                        // Force unpause conditions:
                        // 1. Paused longer than 20 mins
                        // 2. Suspiciously short duration on restore (0.0m usually means pausedAt was null and defaulted to now, or logic error)
                        // 3. User explicit request "never pause" -> We will bias towards unpausing if there's any ambiguity.
                        
                        if (diffMinutes > 20 || diffMinutes < 1.0 || isNaN(diffMinutes)) {
                            console.log(`[SessionManager] Auto-resuming restored session for ${phone} (Reason: Duration ${diffMinutes.toFixed(1)}m)`);
                            
                            // FORCE OVERRIDE
                            state = 'IDLE';
                            pausedAt = undefined;
                            
                            // Update DB immediately to stop the cycle
                            await db.collection('conversations').doc(phone).set({ 
                                status: 'active',
                                pausedAt: null
                            }, { merge: true });
                        }
                    }

                    const session: Session = {
                        phone,
                        name: data?.senderName || name,
                        profilePicUrl: data?.profilePicUrl || profilePicUrl,
                        state,
                        lastActivity: data?.lastActivity?.toDate ? data.lastActivity.toDate() : new Date(),
                        pausedAt,
                        data: {} 
                    };
                    sessions.set(phone, session);
                    
                    // Update DB if info changed
                    if ((name && data?.senderName !== name) || (profilePicUrl && data?.profilePicUrl !== profilePicUrl)) {
                         await db.collection('conversations').doc(phone).set({ 
                            senderName: name,
                            profilePicUrl: profilePicUrl
                        }, { merge: true });
                    }

                    console.log(`[SessionManager] Restored session for ${phone} from DB (State: ${session.state})`);
                    return session;
                }
            } catch (err) {
                console.error('[SessionManager] Error restoring session:', err);
            }
        }

        // 3. Create New
        return sessionManager.createSession(phone, name, profilePicUrl);
    },

    createSession: (phone: string, name: string, profilePicUrl?: string) => {
        const session: Session = {
            phone,
            name,
            profilePicUrl,
            state: 'IDLE',
            lastActivity: new Date(),
            data: {}
        };
        sessions.set(phone, session);

        // Persist new session
        if (db) {
            db.collection('conversations').doc(phone).set({
                phone,
                senderName: name,
                profilePicUrl: profilePicUrl || null,
                status: 'active',
                lastActivity: new Date(),
                createdAt: new Date()
            }, { merge: true }).catch(console.error);
        }

        return session;
    },

    updateState: (phone: string, newState: string) => {
        const session = sessions.get(phone);
        if (session) {
            session.state = newState;
            session.lastActivity = new Date();
            if (newState === 'PAUSED') {
                session.pausedAt = new Date();
            } else {
                session.pausedAt = undefined;
            }
        }
    },

    pauseSession: (phone: string, durationMinutes: number = 20) => {
        const session = sessions.get(phone);
        if (session) {
            session.state = 'PAUSED';
            session.lastActivity = new Date();
            // We set pausedAt to NOW.
            // Logic elsewhere checks if (Now - PausedAt) > 20 mins.
            // If we want a dynamic duration, we might need to store 'pausedUntil' or 'pauseDuration'.
            // For now, the user requested explicitly 20 minutes, so the existing logic (checking diff > 20) works if we set pausedAt = now.
            // However, to support the UI counter, we should store pausedUntil.
            const now = new Date();
            session.pausedAt = now;
            
            // Optional: Store pausedUntil if we want variable durations later
            // session.pausedUntil = new Date(now.getTime() + durationMinutes * 60000);
        }
    }
};
