
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export interface User {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: 'master' | 'user';
    department: string;
}

// Initial Users
const INITIAL_USERS = [
    { name: 'Kairo Lopes', email: 'kairolopes@gmail.com', role: 'master', department: 'Tecnologia' },
    { name: 'Rafael Oliveira', email: 'financeiroservircontabil@gmail.com', role: 'user', department: 'Contabilidade' },
    { name: 'Priscila Alencar', email: 'rhservircontabil@gmail.com', role: 'user', department: 'Contabilidade' },
    { name: 'Micael Gomes', email: 'fiscalservircontabil@gmail.com', role: 'user', department: 'Contabilidade' },
    { name: 'Adiel Macedo', email: 'adielcm@gmail.com', role: 'user', department: 'Contabilidade' },
    { name: 'Paolla Santiago', email: 'paollasantiago15@gmail.com', role: 'user', department: 'Financeiro' }
];

const DEFAULT_PASSWORD = '123456';

let users: User[] = [];

// Load users from file
const loadUsers = () => {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    
    if (fs.existsSync(USERS_FILE)) {
        try {
            const data = fs.readFileSync(USERS_FILE, 'utf-8');
            users = JSON.parse(data);
        } catch (error) {
            console.error('Error reading users file:', error);
            users = [];
        }
    } else {
        seedUsers();
    }
};

const saveUsers = () => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

const seedUsers = () => {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(DEFAULT_PASSWORD, salt);

    users = INITIAL_USERS.map(u => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: u.name,
        email: u.email,
        passwordHash: passwordHash,
        role: u.role as 'master' | 'user',
        department: u.department
    }));
    saveUsers();
    console.log('Users seeded successfully.');
};

// Initialize
loadUsers();

export const userService = {
    findByEmail: (email: string) => users.find(u => u.email.toLowerCase() === email.toLowerCase()),
    
    getAll: () => users.map(u => {
        const { passwordHash, ...userWithoutPass } = u;
        return userWithoutPass;
    }),

    create: (name: string, email: string, department: string, role: 'master' | 'user' = 'user') => {
        if (userService.findByEmail(email)) {
            throw new Error('User already exists');
        }

        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(DEFAULT_PASSWORD, salt);

        const newUser: User = {
            id: Date.now().toString(),
            name,
            email,
            department,
            role,
            passwordHash
        };

        users.push(newUser);
        saveUsers();
        return newUser;
    },

    resetPassword: (email: string) => {
        const user = userService.findByEmail(email);
        if (!user) throw new Error('User not found');

        const salt = bcrypt.genSaltSync(10);
        user.passwordHash = bcrypt.hashSync(DEFAULT_PASSWORD, salt);
        saveUsers();
    }
};
