
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
                const validTitles = ['Administrativo', 'Comercial', 'Contabilidade', 'Financeiro', 'Jurídico', 'Tecnologia'];
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

                const existing = await userService.findSystemUserByEmail(u.email);
                if (existing) {
                    if (existing.id) {
                        await userService.updateSystemUser(existing.id, {
                            name: userData.name,
                            role: userData.role,
                            jobTitle: userData.jobTitle
                        });
                        console.log(`[Seeder] Updated user: ${u.email}`);
                    }
                } else {
                    await userService.createSystemUser(userData);
                    console.log(`[Seeder] Created user: ${u.email}`);
                }
            }

            // Ensure Admin exists
            const adminEmail = 'admin@lopes.com.br';
            const existingAdmin = await userService.findSystemUserByEmail(adminEmail);
            const adminData: SystemUser = {
                name: 'Administrador',
                email: adminEmail,
                role: 'admin',
                jobTitle: 'Administrativo',
                password: '123456'
            };

            if (existingAdmin) {
                 if (existingAdmin.id) {
                    await userService.updateSystemUser(existingAdmin.id, {
                        name: adminData.name,
                        role: adminData.role,
                        jobTitle: adminData.jobTitle
                    });
                    console.log(`[Seeder] Updated Admin.`);
                 }
            } else {
                await userService.createSystemUser(adminData);
                console.log(`[Seeder] Created Admin.`);
            }

        } catch (error) {
            console.error('[Seeder] Error during seeding:', error);
        }
    }
};
