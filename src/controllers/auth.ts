import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { userService } from '../services/userService';

const SECRET_KEY = process.env.JWT_SECRET || 'lopes_secret_key_123';

export const authController = {
    async login(req: Request, res: Response) {
        const { username, email, password } = req.body;
        const loginId = username || email;

        // Hardcoded admin fallback
        if ((loginId === 'admin' || loginId === 'admin@lopes.com.br') && password === '123456') {
            const token = jwt.sign({ username: 'admin', role: 'Tecnologia', name: 'Administrador' }, SECRET_KEY, { expiresIn: '24h' });
            return res.json({ 
                token, 
                user: { name: 'Administrador', email: 'admin@lopes.com.br', role: 'Tecnologia', department: 'Diretoria' } 
            });
        }

        // Hardcoded Master Access for Kairo
        if (loginId === 'kairolopes@gmail.com' && password === '123456') {
            const token = jwt.sign({ username: 'kairolopes@gmail.com', role: 'Tecnologia', name: 'Kairo Lopes' }, SECRET_KEY, { expiresIn: '24h' });
            return res.json({ 
                token, 
                user: { name: 'Kairo Lopes', email: 'kairolopes@gmail.com', role: 'Tecnologia', department: 'Diretoria' } 
            });
        }

        try {
            const user = await userService.findSystemUserByEmail(loginId);
            
            if (user) {
                let isValid = false;

                // 1. Check Hash
                if (user.passwordHash) {
                    isValid = await bcrypt.compare(password, user.passwordHash);
                } 
                // 2. Check Plaintext (Legacy)
                else if (user.password === password) {
                    isValid = true;
                }

                if (isValid) {
                    const token = jwt.sign({ 
                        id: user.id, 
                        username: user.email, 
                        role: user.role,
                        name: user.name 
                    }, SECRET_KEY, { expiresIn: '24h' });
                    
                    const { password, passwordHash, ...userSafe } = user;
                    return res.json({ token, user: userSafe });
                }
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

    async createUser(req: Request, res: Response) {
        try {
            const { name, email, password, role, department } = req.body;
            const newUser = await userService.createSystemUser({
                name, email, password, role, department
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
router.post('/users', authenticateJWT, authController.createUser); // Only admin should access, handled by frontend for now or add middleware
export default router;
