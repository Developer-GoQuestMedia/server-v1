import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { r2Client } from '../server.js';

export async function listR2Files() {
    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET_NAME,
        });

        const response = await r2Client.send(command);
        console.log('Files in R2 bucket:');
        console.log(`Total files in R2 bucket: ${response.Contents?.length || 0}`);
        return response.Contents;
    } catch (error) {
        console.error('Error listing R2 files:', error);
        return null;
    }
} 