import { listR2All } from '@/utils/listR2All';

export default async function handler(req, res) {
    try {
        const result = await listR2All();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
