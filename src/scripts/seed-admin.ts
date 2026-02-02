
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

        const existing = await userService.findSystemUserByEmail(email);
        if (existing) {
            console.log('Admin user already exists.');
        } else {
            console.log('Creating admin user...');
            await userService.createSystemUser({
                name: 'Administrador',
                email: email,
                password: password,
                role: 'Tecnologia',
                department: 'Management'
            });
            console.log('Admin user created successfully.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
