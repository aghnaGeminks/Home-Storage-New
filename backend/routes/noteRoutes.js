const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const authenticateToken = require('../middleware/auth');

// Semua route catatan membutuhkan autentikasi
router.use(authenticateToken);

// Create note
router.post('/', noteController.createNote);

// List & search notes
router.get('/', noteController.getNotes);

// Get note by id
router.get('/:id', noteController.getNoteById);

// Update note
router.put('/:id', noteController.updateNote);

// Delete note
router.delete('/:id', noteController.deleteNote);

module.exports = router;
