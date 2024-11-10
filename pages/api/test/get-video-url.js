import { getR2PreSignedUrl } from '@/utils/getR2PreSignedUrl';

export default async function handler(req, res) {
    const { key } = req.query;

    if (!key) {
        return res.status(400).json({ error: 'Video key is required' });
    }

    try {
        const presignedUrl = await getR2PreSignedUrl(key);
        res.status(200).json({ url: presignedUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
