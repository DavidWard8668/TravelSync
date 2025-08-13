import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    app: 'Second Chance Recovery'
  });
});

app.get('/api/crisis-resources', (req, res) => {
  res.json({
    resources: [
      { name: '988 Suicide & Crisis Lifeline', phone: '988', available: '24/7' },
      { name: 'Crisis Text Line', phone: '741741', text: 'HOME', available: '24/7' },
      { name: 'SAMHSA Helpline', phone: '1-800-662-4357', available: '24/7' }
    ]
  });
});

app.get('/api/monitored-apps', (req, res) => {
  res.json({
    apps: [
      { id: 1, name: 'Snapchat', status: 'blocked', risk: 'high' },
      { id: 2, name: 'Instagram', status: 'monitored', risk: 'medium' },
      { id: 3, name: 'WhatsApp', status: 'allowed', risk: 'low' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Second Chance Server: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});
