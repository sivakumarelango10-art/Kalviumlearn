import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import campusRoutes from './routes/campus.js';
import mentorRoutes from './routes/mentor.js';
import studentRoutes from './routes/student.js';
import codeRoutes from './routes/code.js';
import systemRoutes from './routes/system.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/campus', campusRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/system', systemRoutes);

// Root test endpoint
app.get('/api', (_req, res) => {
  res.json({
    platform: 'KALVI LEARN',
    version: '1.0.0',
    brand: {
      primary: 'Kalvi (Red)',
      secondary: 'Learn (Black)',
      background: 'White'
    },
    message: 'Kalvi Learn Production API Gateway Online'
  });
});

app.listen(port, () => {
  console.log(`========================================================`);
  console.log(`  KALVI LEARN — Backend API Gateway running on port ${port}`);
  console.log(`  Connected to PostgreSQL at Supabase`);
  console.log(`  Sandbox Execution: ${process.env.JUDGE0_URL || 'https://ce.judge0.com'}`);
  console.log(`========================================================`);
});
