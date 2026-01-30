
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userService } from '../services/userService';
import { config } from '../config/env';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'lopes-secret-key-change-me';

// Login Endpoint
router.post('/login', (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).send('Email and password required');
        return;
    }

    const user = userService.findByEmail(email);
    if (!user) {
        res.status(401).send('Invalid credentials');
        return;
    }

    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) {
        res.status(401).send('Invalid credentials');
        return;
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({
        token,
        user: {
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department
        }
    });
});

// Middleware to verify Token
export const authenticateJWT = (req: any, res: Response, next: any) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// --- USER MANAGEMENT ENDPOINTS (Master Only) ---

router.get('/users', authenticateJWT, (req: any, res: Response) => {
    if (req.user.role !== 'master') {
        return res.status(403).send('Access denied');
    }
    const users = userService.getAll();
    res.json(users);
});

router.post('/users', authenticateJWT, (req: any, res: Response) => {
    if (req.user.role !== 'master') {
        return res.status(403).send('Access denied');
    }

    try {
        const { name, email, department, role } = req.body;
        const newUser = userService.create(name, email, department, role);
        res.status(201).json(newUser);
    } catch (error: any) {
        res.status(400).send(error.message);
    }
});

export default router;
