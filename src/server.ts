import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { config } from './config/env';
import { db } from './config/firebase';
import webhookRoutes from './controllers/webhook';
import adminRoutes from './controllers/admin';
import ticketRoutes from './controllers/tickets';
import authRoutes, { authenticateJWT } from './controllers/auth';
import { campaignService } from './services/campaign';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api', webhookRoutes);

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
    try {
        const status = {
            server: 'online',
            timestamp: new Date().toISOString(),
            firebase: 'unknown',
            ai_service: config.gemini.apiKey ? 'configured' : 'missing_key'
        };

        if (db) {
            try {
                // Try to read a dummy doc to check connection
                await db.collection('health_check').doc('ping').set({ last_check: new Date() });
                status.firebase = 'connected';
                res.json(status);
            } catch (dbError: any) {
                console.error('Health Check - Firebase Error:', dbError);
                status.firebase = 'error';
                res.status(503).json({ ...status, error: dbError.message });
            }
        } else {
            status.firebase = 'not_initialized';
            res.status(503).json(status);
        }
    } catch (error) {
        res.status(500).json({ status: 'error', error: 'Internal Server Error' });
    }
});

// Protect Admin Routes with Authentication
// @ts-ignore
// app.use('/api/admin', authenticateJWT, adminRoutes);
app.use('/api/admin', adminRoutes); // Temporary: Disable auth for dashboard testing
app.use('/api/tickets', ticketRoutes);

// Serve Static Files (Dashboard)
app.use(express.static(path.join(__dirname, '../dashboard/dist')));

// Handle React Routing (SPA) - Serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not Found' });
  }
  res.sendFile(path.join(__dirname, '../dashboard/dist/index.html'));
});

// Start Campaign Engine Loop (every 60 seconds)
setInterval(() => {
    campaignService.process().catch(console.error);
}, 60000);

if (require.main === module) {
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log('Campaign Engine started.');
    });
}

export default app;
