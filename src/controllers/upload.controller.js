import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '../server.js';

export const uploadAudio = async (req, res) => {
  try {
    const { file, dialogueId } = req.body;
    const fileName = `audio/${dialogueId}-${Date.now()}.wav`;

    const uploadParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: Buffer.from(file.split(',')[1], 'base64'),
      ContentType: 'audio/wav',
    };

    await r2Client.send(new PutObjectCommand(uploadParams));

    const audioUrl = `${process.env.R2_BUCKET_ENDPOINT}${fileName}`;
    
    res.status(200).json({ 
      success: true, 
      audioUrl 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading file' 
    });
  }
};
