
import { db } from '../config/firebase';
import { userService } from '../services/userService';

const seedAdmin = async () => {
    try {
        if (!db) {
            console.error('Firebase DB not initialized. Check credentials.');
            process.exit(1);
        }

        const email = 'admin@lopes.com.br';
        const password = '123456'; // In production, hash this!

        // 1. Check Default Admin
        const existing = await userService.findSystemUserByEmail(email);
        if (existing) {
            console.log('Admin user already exists.');
        } else {
            console.log('Creating admin user...');
            await userService.createSystemUser({
                name: 'Administrador',
                email: email,
                password: password,
                role: 'Tecnologia'
            });
            console.log('Admin user created successfully.');
        }

        // 2. Check Kairo
        const kairoEmail = 'kairolopes@gmail.com';
        const existingKairo = await userService.findSystemUserByEmail(kairoEmail);
        if (existingKairo) {
            console.log('Kairo user already exists.');
        } else {
            console.log('Creating Kairo user...');
            await userService.createSystemUser({
                name: 'Kairo Lopes',
                email: kairoEmail,
                password: password,
                role: 'Tecnologia'
            });
            console.log('Kairo user created successfully.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
