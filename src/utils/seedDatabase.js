import mongoose from 'mongoose';
import { Dialogue } from '../models/Dialogue.js';
import { Project } from '../models/Project.js';
import { checkR2File } from './checkR2File.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedDatabase() {
    try {
        // Use the first clip as the main project video
        const mainVideoPath = 'Kuma/Kuma Clip 01.mp4';
        const videoExists = await checkR2File(mainVideoPath);
        
        if (!videoExists) {
            throw new Error(`Video file ${mainVideoPath} not found in R2 bucket`);
        }

        const baseVideoUrl = `${process.env.R2_PUBLIC_ENDPOINT}/${process.env.R2_BUCKET_NAME}/Kuma/Kuma Clip`;
        
        // Create a default project
        const defaultProject = await Project.findOneAndUpdate(
            { title: 'Kuma Project' },
            {
                title: 'Kuma Project',
                description: 'Turkish animation dubbing project',
                sourceLanguage: 'Turkish',
                targetLanguage: 'English',
                videoUrl: `${baseVideoUrl} 01.mp4`,
                createdBy: new mongoose.Types.ObjectId(), // Placeholder user ID
            },
            { upsert: true, new: true }
        );

        // Read and parse the sample data
        const rawData = await fs.readFile(path.join(__dirname, '../../Sample.json'), 'utf8');
        const rawDialogues = JSON.parse(rawData);

        // Transform the data to match the schema
        const dialogues = rawDialogues.map((dialogue, index) => {
            // Calculate which clip to use based on the dialogue index
            const clipNumber = Math.floor(index / 10) + 1; // Adjust this logic based on your needs
            const clipNumberFormatted = String(clipNumber).padStart(2, '0');
            
            return {
                project: defaultProject._id,
                index: dialogue.id,
                timeStart: dialogue.time_start,
                timeEnd: dialogue.time_end,
                character: dialogue.character,
                videoUrl: `${baseVideoUrl} ${clipNumberFormatted}.mp4`,
                dialogue: {
                    original: dialogue.dialogue.original,
                    translated: dialogue.dialogue.translated,
                    adapted: dialogue.dialogue.adapted
                },
                emotions: {
                    primary: {
                        emotion: dialogue.primary?.emotion,
                        intensity: dialogue.primary?.intensity
                    },
                    secondary: {
                        emotion: dialogue.secondary?.emotion,
                        intensity: dialogue.secondary?.intensity
                    }
                },
                direction: dialogue.direction,
                lipMovements: dialogue.lip_movements,
                sceneContext: dialogue.scene_context,
                technicalNotes: dialogue.technical_notes,
                culturalNotes: dialogue.cultural_notes,
                status: dialogue.status || "pending",
                audioUrl: dialogue.audioURL || null
            };
        });

        // Clear existing dialogues
        await Dialogue.deleteMany({});

        // Insert new dialogues
        await Dialogue.insertMany(dialogues);

        console.log('\nDatabase seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`Field "${key}":`, error.errors[key].message);
            });
        }
    }
}
