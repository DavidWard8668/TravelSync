// Minimal working server to test button functionality
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Second Chance Server Running',
    timestamp: new Date().toISOString()
  });
});

// Mock authentication endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email, password: '***' });
  
  // Mock successful login
  res.json({
    success: true,
    token: 'mock-jwt-token-123',
    user: {
      id: '1',
      email: email,
      role: 'master',
      name: 'Test User'
    }
  });
});

// Mock app monitoring endpoints
app.get('/api/apps/monitored', (req, res) => {
  console.log('Fetching monitored apps');
  res.json([
    {
      id: '1',
      name: 'Instagram',
      packageName: 'com.instagram.android',
      category: 'social',
      riskLevel: 'high',
      status: 'active'
    },
    {
      id: '2',
      name: 'TikTok',
      packageName: 'com.tiktok.app',
      category: 'social',
      riskLevel: 'high',
      status: 'active'
    }
  ]);
});

// Mock approval requests
app.get('/api/apps/requests', (req, res) => {
  console.log('Fetching approval requests');
  res.json([
    {
      id: '1',
      app_name: 'Instagram',
      client_name: 'Test Client',
      client_email: 'client@test.com',
      status: 'pending',
      created_at: new Date().toISOString()
    }
  ]);
});

// Mock request approval
app.post('/api/apps/requests/:id/respond', (req, res) => {
  const { id } = req.params;
  const { action, message } = req.body;
  
  console.log(`Request ${id} ${action}ed:`, message);
  
  res.json({
    success: true,
    id,
    action,
    message
  });
});

// Crisis support endpoints
app.get('/api/crisis/resources', (req, res) => {
  console.log('Fetching crisis resources');
  res.json([
    {
      name: 'Samaritans',
      phone: '116 123',
      description: 'Free confidential support 24/7',
      website: 'https://www.samaritans.org'
    },
    {
      name: 'Emergency Services',
      phone: '999',
      description: 'Immediate emergency assistance',
      website: null
    }
  ]);
});

// Socket.io for real-time notifications
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
  
  // Mock real-time notification after 3 seconds
  setTimeout(() => {
    socket.emit('notification', {
      type: 'app_request',
      message: 'New app access request from client',
      timestamp: new Date().toISOString()
    });
  }, 3000);
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

// Start server
server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 SECOND CHANCE RECOVERY SERVER STARTED');
  console.log('='.repeat(50));
  console.log(`📱 Client App: http://localhost:${PORT}`);
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('✅ All endpoints ready for button testing');
  console.log('='.repeat(50));
});

export default server;