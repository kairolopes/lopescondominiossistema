import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'lopes_secret_key_123';

export const authController = {
    async login(req: Request, res: Response) {
        const { username, password } = req.body;

        // Hardcoded admin for prototype
        if (username === 'admin' && password === 'lopes2024') {
            const token = jwt.sign({ username, role: 'admin' }, SECRET_KEY, { expiresIn: '24h' });
            return res.json({ token });
        }

        return res.status(401).json({ error: 'Invalid credentials' });
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
export default router;
