import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes and middleware
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import appRoutes from './routes/apps.js';
import notificationRoutes from './routes/notifications.js';
import crisisRoutes from './routes/crisis.js';

// Import socket handlers
import { setupSocketHandlers } from './socket/handlers.js';

// Import database
import { initDatabase } from './database/init.js';

// Import middleware
import { authenticateToken } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://second-chance-recovery.app']
      : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.youtube.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "ws:", "wss:"],
      mediaSrc: ["'self'", "https://www.youtube.com"],
      frameSrc: ["'self'", "https://www.youtube.com"]
    }
  }
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://second-chance-recovery.app']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Rate limiting
app.use(rateLimitMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use(express.static(path.join(__dirname, '../dist')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0-beta',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/apps', authenticateToken, appRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/crisis', crisisRoutes); // Crisis routes don't require auth for emergency access

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Don't log password or token errors in detail
  if (err.message && (err.message.includes('password') || err.message.includes('token'))) {
    console.error('Authentication error occurred');
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'An error occurred' 
      : err.message,
    timestamp: new Date().toISOString()
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔧 Initializing Second Chance Recovery Server...');
    
    // Initialize database
    await initDatabase();
    console.log('✅ Database initialized');
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Second Chance Recovery Server running on port ${PORT}`);
      console.log(`📱 Client: http://localhost:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('💙 Ready to support recovery journeys!');
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Received SIGTERM signal, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();