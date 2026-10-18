const { Op } = require('sequelize');
const { Note } = require('../models');

/**
 * Membuat catatan baru
 * POST /api/notes
 */
const createNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title && !content) {
      return res.status(400).json({
        success: false,
        message: 'Judul atau isi catatan tidak boleh kosong.',
      });
    }

    const note = await Note.create({
      user_id: req.user.id,
      title: title ? title.trim() : '',
      content: content ? content.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Catatan berhasil disimpan.',
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mengambil daftar catatan milik pengguna
 * GET /api/notes?q=keyword
 */
const getNotes = async (req, res, next) => {
  try {
    const { q } = req.query;
    const whereClause = { user_id: req.user.id };

    const searchOp = (Note.sequelize?.getDialect() === 'postgres') ? Op.iLike : Op.like;

    if (q && q.trim()) {
      const keyword = `%${q.trim()}%`;
      whereClause[Op.or] = [
        { title: { [searchOp]: keyword } },
        { content: { [searchOp]: keyword } },
      ];
    }

    const notes = await Note.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: notes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mendapatkan detail catatan berdasarkan ID
 * GET /api/notes/:id
 */
const getNoteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const note = await Note.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Catatan tidak ditemukan.',
      });
    }

    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Memperbarui catatan
 * PUT /api/notes/:id
 */
const updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const note = await Note.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Catatan tidak ditemukan.',
      });
    }

    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content.trim();

    await note.save();

    res.status(200).json({
      success: true,
      message: 'Catatan berhasil diperbarui.',
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Menghapus catatan
 * DELETE /api/notes/:id
 */
const deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;

    const note = await Note.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Catatan tidak ditemukan.',
      });
    }

    await note.destroy();

    res.status(200).json({
      success: true,
      message: 'Catatan berhasil dihapus.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
};
