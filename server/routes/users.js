import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../database/init.js';

const router = express.Router();

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await database.get(
      'SELECT id, email, role, name, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { name } = req.body;
    
    await database.run(
      'UPDATE users SET name = ? WHERE id = ?',
      [name, req.user.id]
    );
    
    const updatedUser = await database.get(
      'SELECT id, email, role, name, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's connections (for Master users)
router.get('/connections', async (req, res) => {
  try {
    if (req.user.role !== 'master') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const connections = await database.all(`
      SELECT u.id, u.email, u.name, u.created_at, u.last_active
      FROM users u
      INNER JOIN user_connections uc ON u.id = uc.client_id
      WHERE uc.master_id = ? AND uc.status = 'active'
    `, [req.user.id]);
    
    res.json(connections);
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;