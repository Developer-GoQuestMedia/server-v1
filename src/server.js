import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { seedDatabase } from './utils/seedDatabase.js';
import { listR2Folders } from './utils/listR2Folders.js';
import { listR2Files } from './utils/listR2Files.js';
import { setupSwagger } from './swagger.js';
import { getDialogues, updateDialogue, getSequentialDialogues } from './controllers/dialogue.controller.js';

// Routes
import dialogueRoutes from './routes/dialogue.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import testRoutes from './routes/test.routes.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Set up CORS
const corsOptions = {
    origin: '*', // Replace with your frontend URL or use '*' for all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};

// Use CORS middleware
app.use(cors(corsOptions));

// Set up Swagger
setupSwagger(app);

// R2 Client Configuration
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_PUBLIC_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // List files in R2 bucket
    console.log('\nChecking R2 bucket contents:');
    await listR2Folders();
    await listR2Files();
    
    // Then try seeding of populating data form JSON file
    // await seedDatabase();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/dialogues', dialogueRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/test', testRoutes);

// Define your routes
app.get('/dialogues', getDialogues);
app.put('/dialogues/:id', updateDialogue);
app.get('/dialogues/sequential', getSequentialDialogues); // Example for another endpoint

// Add this after your existing routes
app.get('/api/test', async (req, res) => {
  try {
    // Test MongoDB Connection
    const mongoStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';

    // Test R2 Connection
    let r2Status = 'Failed';
    try {
      await r2Client.send(new HeadBucketCommand({ Bucket: process.env.R2_BUCKET_NAME }));
      r2Status = 'Connected';
    } catch (error) {
      console.error('R2 connection error:', error);
    }

    res.json({
      server: 'Running',
      mongodb: mongoStatus,
      r2: r2Status,
      environment: {
        mongodbUri: process.env.MONGODB_URI ? 'Configured' : 'Missing',
        r2Bucket: process.env.R2_BUCKET_NAME ? 'Configured' : 'Missing',
        r2Endpoint: process.env.R2_PUBLIC_ENDPOINT ? 'Configured' : 'Missing'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
