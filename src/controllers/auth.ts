import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userService } from '../services/userService';

const SECRET_KEY = process.env.JWT_SECRET || 'lopes_secret_key_123';

export const authController = {
    async login(req: Request, res: Response) {
        const { username, email, password } = req.body;
        const loginId = username || email;

        // Hardcoded admin fallback
        if ((loginId === 'admin' || loginId === 'admin@lopes.com.br') && password === '123456') {
            const token = jwt.sign({ username: 'admin', role: 'admin', name: 'Master Admin' }, SECRET_KEY, { expiresIn: '24h' });
            return res.json({ 
                token, 
                user: { name: 'Master Admin', email: 'admin', role: 'master' } 
            });
        }

        try {
            const user = await userService.findSystemUserByEmail(loginId);
            if (user && user.password === password) { // TODO: Use bcrypt
                 const token = jwt.sign({ 
                     id: user.id, 
                     username: user.email, 
                     role: user.role,
                     name: user.name 
                 }, SECRET_KEY, { expiresIn: '24h' });
                 
                 const { password, ...userSafe } = user;
                 return res.json({ token, user: userSafe });
            }
        } catch (error) {
            console.error('Login error:', error);
        }

        return res.status(401).json({ error: 'Invalid credentials' });
    },

    async getUsers(req: Request, res: Response) {
        try {
            const users = await userService.getAllSystemUsers();
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    async updateUser(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { name, role, jobTitle } = req.body;
            
            await userService.updateSystemUser(userId, { name, role, jobTitle });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    async createUser(req: Request, res: Response) {
        try {
            const { name, email, password, role, jobTitle } = req.body;
            const newUser = await userService.createSystemUser({
                name, email, password, role, jobTitle
            });
            res.status(201).json(newUser);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
};

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
            if (err) {
                return res.sendStatus(403);
            }
            (req as any).user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

import express from 'express';
const router = express.Router();
router.post('/login', authController.login);
router.get('/users', authenticateJWT, authController.getUsers);
router.post('/users', authenticateJWT, authController.createUser);
router.patch('/users/me', authenticateJWT, authController.updateUser);
router.patch('/users/:id', authenticateJWT, authController.updateUserById);
export default router;
