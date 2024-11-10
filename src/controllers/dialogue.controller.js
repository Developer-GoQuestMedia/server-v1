import { Dialogue } from '../models/Dialogue.js';
import { checkR2File } from '../utils/checkR2File.js';
import { getR2PreSignedUrl } from '../utils/getR2PreSignedUrl.js';

export const getDialogues = async (req, res) => {
  try {
    const dialogues = await Dialogue.find({ project: req.query.projectId })
      .sort({ index: 1 })
      .populate('lastEditedBy', 'name');
    
    // Generate presigned URLs for all videos
    const dialoguesWithUrls = await Promise.all(
      dialogues.map(async (dialogue) => {
        if (dialogue.videoUrl) {
          const presignedUrl = await getR2PreSignedUrl(dialogue.videoUrl);
          return {
            ...dialogue.toObject(),
            videoUrl: presignedUrl
          };
        }
        return dialogue;
      })
    );

    res.json(dialoguesWithUrls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDialogue = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const dialogue = await Dialogue.findByIdAndUpdate(
      id,
      { 
        ...updates,
        updatedAt: Date.now(),
        lastEditedBy: req.user._id // Assuming you have authentication middleware
      },
      { new: true }
    );

    if (!dialogue) {
      return res.status(404).json({ message: 'Dialogue not found' });
    }

    res.json(dialogue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, audioUrl } = req.body;

    const dialogue = await Dialogue.findByIdAndUpdate(
      id,
      { 
        status,
        audioUrl,
        updatedAt: Date.now(),
        lastEditedBy: req.user._id
      },
      { new: true }
    );

    if (!dialogue) {
      return res.status(404).json({ message: 'Dialogue not found' });
    }

    res.json(dialogue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSequentialDialogues = async (req, res) => {
    try {
        const { startIndex = 1, projectId } = req.query;
        const count = 5; // Number of dialogues to return

        // Fetch 5 sequential dialogues
        const dialogues = await Dialogue.find({ 
            project: projectId,
            index: { 
                $gte: parseInt(startIndex) 
            }
        })
        .sort({ index: 1 })
        .limit(count)
        .populate('lastEditedBy', 'name');

        // Base URL for R2 bucket
        const baseUrl = `${process.env.R2_PUBLIC_ENDPOINT}/${process.env.R2_BUCKET_NAME}/Kuma/Kuma Clip`;
        
        // Process each dialogue to ensure correct video URL
        const processedDialogues = await Promise.all(dialogues.map(async (dialogue) => {
            const dialogueObj = dialogue.toObject();
            
            // Calculate clip number based on dialogue index
            const clipNumber = Math.floor((dialogue.index - 1) / 10) + 1;
            const clipNumberFormatted = String(clipNumber).padStart(2, '0');
            const videoPath = `Kuma/Kuma Clip ${clipNumberFormatted}.mp4`;

            // Check if the specific clip exists
            const clipExists = await checkR2File(videoPath);

            // Use the specific clip if it exists, otherwise use Clip 01
            dialogueObj.videoUrl = clipExists 
                ? `${baseUrl} ${clipNumberFormatted}.mp4`
                : `${baseUrl} 01.mp4`;

            return dialogueObj;
        }));

        res.json({
            dialogues: processedDialogues,
            hasMore: processedDialogues.length === count,
            nextStartIndex: parseInt(startIndex) + count
        });

    } catch (error) {
        console.error('Error fetching sequential dialogues:', error);
        res.status(500).json({ 
            error: 'Failed to fetch dialogues',
            details: error.message 
        });
    }
};
