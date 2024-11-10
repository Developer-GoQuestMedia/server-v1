import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export async function listR2Folders(showContents) {
    const s3 = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_PUBLIC_ENDPOINT,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
    });

    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET_NAME,
            Delimiter: '/',
        });
        const response = await s3.send(command);
        
        const folders = response.CommonPrefixes
            ? response.CommonPrefixes.map(prefix => prefix.Prefix.replace(/\/$/, ''))
            : [];

        if (showContents) {
            return await Promise.all(
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
                        })) || []
                    };
                })
            );
        }

        return folders;
    } catch (error) {
        console.error('Error listing R2 folders:', error);
        throw error;
    }
}
