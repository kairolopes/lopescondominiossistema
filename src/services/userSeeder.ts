
import { userService, SystemUser } from './userService';
import path from 'path';
import fs from 'fs';

export const userSeeder = {
    async run() {
        console.log('[Seeder] Starting user seeding...');
        try {
            // Load users.json
            const jsonPath = path.join(__dirname, '../../data/users.json');
            if (!fs.existsSync(jsonPath)) {
                console.warn('[Seeder] users.json not found at:', jsonPath);
                return;
            }

            const rawData = fs.readFileSync(jsonPath, 'utf-8');
            const users = JSON.parse(rawData);

            console.log(`[Seeder] Found ${users.length} users to seed.`);

            for (const u of users) {
                // Determine valid role
                let sysRole: 'admin' | 'agent' = 'agent';
                if (u.role === 'admin' || u.role === 'master') sysRole = 'admin';

                // Determine valid jobTitle (default to Administrativo if unknown)
                const validTitles = ['Administrativo', 'Comercial', 'Contabilidade', 'Financeiro', 'Jurídico'];
                let jobTitle = 'Administrativo';
                if (validTitles.includes(u.jobTitle)) {
                    jobTitle = u.jobTitle;
                } else if (validTitles.includes(u.department)) { // Legacy fallback
                    jobTitle = u.department;
                }

                const userData: SystemUser = {
                    name: u.name,
                    email: u.email,
                    role: sysRole,
                    jobTitle: jobTitle,
                    password: u.password || '123456'
                };

                await userService.createSystemUser(userData);
                console.log(`[Seeder] Synced user: ${u.email}`);
            }

            // Ensure Admin exists
            await userService.createSystemUser({
                name: 'Administrador',
                email: 'admin@lopes.com.br',
                role: 'admin',
                jobTitle: 'Administrativo',
                password: '123456'
            });
            console.log(`[Seeder] Synced Admin.`);

        } catch (error) {
            console.error('[Seeder] Error during seeding:', error);
        }
    }
};
