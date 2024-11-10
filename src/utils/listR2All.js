import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export async function listR2All() {
    const s3 = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_PUBLIC_ENDPOINT,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
    });

    try {
        // First, get all folders
        const foldersCommand = new ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET_NAME,
            Delimiter: '/',
        });
        const foldersResponse = await s3.send(foldersCommand);
        
        // Get folders
        const folders = foldersResponse.CommonPrefixes
            ? foldersResponse.CommonPrefixes.map(prefix => prefix.Prefix.replace(/\/$/, ''))
            : [];

        // Get root files (files not in any folder)
        const rootFiles = foldersResponse.Contents
            ? foldersResponse.Contents
                .filter(item => !item.Key.includes('/'))
                .map(item => ({
                    key: item.Key,
                    size: item.Size,
                    lastModified: item.LastModified
                }))
            : [];

        // Get contents of each folder
        const folderContents = await Promise.all(
            folders.map(async (folder) => {
                const contentsCommand = new ListObjectsV2Command({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Prefix: `${folder}/`,
                });
                const folderResponse = await s3.send(contentsCommand);
                return {
                    name: folder,
                    files: folderResponse.Contents?.map(item => ({
                        key: item.Key,
                        size: item.Size,
                        lastModified: item.LastModified
                    }))
                };
            })
        );

        return {
            folders,
            rootFiles,
            folderContents
        };
    } catch (error) {
        console.error('Error listing R2 objects:', error);
        throw error;
    }
}
