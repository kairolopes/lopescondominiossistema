import express, { Request, Response } from 'express';
import { ticketService } from '../services/ticketService';

const router = express.Router();

// Get all tickets
router.get('/', async (req: Request, res: Response) => {
    try {
        const tickets = await ticketService.getAll();
        res.json(tickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Create a new ticket
router.post('/', async (req: Request, res: Response) => {
    try {
        const ticket = await ticketService.create(req.body);
        res.status(201).json(ticket);
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ error: 'Error creating ticket' });
    }
});

// Update a ticket
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const ticket = await ticketService.update(id, req.body);
        res.json(ticket);
    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ error: 'Error updating ticket' });
    }
});

// Delete a ticket
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await ticketService.delete(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting ticket:', error);
        res.status(500).json({ error: 'Error deleting ticket' });
    }
});

export default router;
