import express from 'express';
import { getDialogues, updateDialogue, updateStatus, getSequentialDialogues } from '../controllers/dialogue.controller.js';

const router = express.Router();

router.get('/sequential', getSequentialDialogues);
router.get('/', getDialogues);
router.patch('/:id', updateDialogue);
router.patch('/:id/status', updateStatus);

export default router;
