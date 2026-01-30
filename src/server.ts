import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { config } from './config/env';
import webhookRoutes from './controllers/webhook';
import adminRoutes from './controllers/admin';
import authRoutes, { authenticateJWT } from './controllers/auth';
import { campaignService } from './services/campaign';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api', webhookRoutes);
// Protect Admin Routes with Authentication
app.use('/api/admin', authenticateJWT, adminRoutes);

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
