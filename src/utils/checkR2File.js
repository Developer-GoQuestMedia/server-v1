import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '../server.js';

export async function checkR2File(filePath) {
    try {
        await r2Client.send(new HeadObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: filePath
        }));
        console.log(`File exists: ${filePath}`);
        return true;
    } catch (error) {
        console.error(`File does not exist or error checking: ${filePath}`);
        console.error('Error:', error.message);
        return false;
    }
}
