import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function getR2PreSignedUrl(key) {
    if (!process.env.R2_ACCOUNT_ID) {
        throw new Error('R2_ACCOUNT_ID is not defined in environment variables');
    }

    const s3 = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_PUBLIC_ENDPOINT,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
    });

    try {
        const cleanKey = key.includes('r2.cloudflarestorage.com') 
            ? key.split('test-bucket/')[1]
            : key;

        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: cleanKey,
        });

        const presignedUrl = await getSignedUrl(s3, command, { 
            expiresIn: 3600,
        });
        
        console.log('Generated URL:', presignedUrl);
        return presignedUrl;
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        throw error;
    }
}
