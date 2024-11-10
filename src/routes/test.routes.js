import express from 'express';
import mongoose from 'mongoose';
import { checkR2File } from '../utils/checkR2File.js';
import { listR2Files } from '../utils/listR2Files.js';
import { listR2Folders } from '../utils/listR2Folders.js';

const router = express.Router();

router.get('/check-video', async (req, res) => {
    try {
        const videoPath = 'Kuma/Kuma Clip 01.mp4';
        const exists = await checkR2File(videoPath);
        
        res.json({
            exists,
            path: videoPath,
            fullUrl: exists ? `${process.env.R2_PUBLIC_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${videoPath}` : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/list-projects', async (req, res) => {
    try {
        const Project = mongoose.model('Project');
        const projects = await Project.find().exec();
        console.log('Found projects:', projects);
        res.json({ projects });
    } catch (error) {
        console.error('Error fetching projects:', error);
        if (error.name === 'MongooseError') {
            console.error('Please check your MongoDB connection.');
        }
        res.status(500).json({ error: error.message });
    }
});

router.get('/list-files', async (req, res) => {
    try {
        const files = await listR2Files();
        res.json({ files });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/list-folders', async (req, res) => {
    try {
        const folders = await listR2Folders();
        res.json({ folders });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
