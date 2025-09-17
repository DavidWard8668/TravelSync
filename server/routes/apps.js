import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../database/init.js';

const router = express.Router();

// Get monitored apps for a user
router.get('/monitored', async (req, res) => {
  try {
    const apps = await database.all(`
      SELECT * FROM monitored_apps 
      WHERE user_id = ? 
      ORDER BY name ASC
    `, [req.user.id]);
    
    res.json(apps);
  } catch (error) {
    console.error('Error fetching monitored apps:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add app to monitoring
router.post('/monitored', async (req, res) => {
  try {
    const { name, packageName, category, riskLevel } = req.body;
    
    if (!name || !packageName) {
      return res.status(400).json({ error: 'Name and package name are required' });
    }
    
    const appId = uuidv4();
    
    await database.run(`
      INSERT INTO monitored_apps (id, user_id, name, package_name, category, risk_level, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `, [appId, req.user.id, name, packageName, category || 'other', riskLevel || 'medium']);
    
    const newApp = await database.get(
      'SELECT * FROM monitored_apps WHERE id = ?',
      [appId]
    );
    
    res.status(201).json(newApp);
  } catch (error) {
    console.error('Error adding monitored app:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update monitored app
router.put('/monitored/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, riskLevel, status } = req.body;
    
    await database.run(`
      UPDATE monitored_apps 
      SET name = ?, category = ?, risk_level = ?, status = ?
      WHERE id = ? AND user_id = ?
    `, [name, category, riskLevel, status, id, req.user.id]);
    
    const updatedApp = await database.get(
      'SELECT * FROM monitored_apps WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (!updatedApp) {
      return res.status(404).json({ error: 'App not found' });
    }
    
    res.json(updatedApp);
  } catch (error) {
    console.error('Error updating monitored app:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete monitored app
router.delete('/monitored/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await database.run(
      'DELETE FROM monitored_apps WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting monitored app:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get app usage requests (for Master users)
router.get('/requests', async (req, res) => {
  try {
    if (req.user.role !== 'master') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const requests = await database.all(`
      SELECT ar.*, ma.name as app_name, u.name as client_name, u.email as client_email
      FROM approval_requests ar
      INNER JOIN monitored_apps ma ON ar.app_id = ma.id
      INNER JOIN users u ON ar.client_id = u.id
      WHERE ar.master_id = ?
      ORDER BY ar.created_at DESC
      LIMIT 50
    `, [req.user.id]);
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching app requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle app usage request
router.post('/requests/:id/respond', async (req, res) => {
  try {
    if (req.user.role !== 'master') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { id } = req.params;
    const { action, message } = req.body;
    
    if (!['approve', 'deny'].includes(action)) {
      return res.status(400).json({ error: 'Action must be approve or deny' });
    }
    
    const request = await database.get(
      'SELECT * FROM approval_requests WHERE id = ? AND master_id = ?',
      [id, req.user.id]
    );
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    await database.run(`
      UPDATE approval_requests 
      SET status = ?, response_message = ?, responded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [action === 'approve' ? 'approved' : 'denied', message || null, id]);
    
    const updatedRequest = await database.get(
      'SELECT * FROM approval_requests WHERE id = ?',
      [id]
    );
    
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error responding to app request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;