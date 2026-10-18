const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { File, Note } = require('../models');

/**
 * Upload satu atau beberapa file
 * POST /api/files/upload
 */
const uploadFiles = async (req, res, next) => {
  try {
    const rawFiles = req.files || (req.file ? [req.file] : []);

    if (!rawFiles || rawFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada file yang dipilih untuk diunggah.',
      });
    }

    const createdFiles = [];

    for (const file of rawFiles) {
      const record = await File.create({
        user_id: req.user.id,
        original_name: file.originalname,
        stored_name: file.filename,
        mime_type: file.mimetype || 'application/octet-stream',
        size: file.size,
        path: file.path,
      });
      createdFiles.push(record);
    }

    res.status(201).json({
      success: true,
      message: `${createdFiles.length} file berhasil diunggah.`,
      data: createdFiles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mengambil daftar file milik pengguna
 * GET /api/files?q=keyword
 */
const getFiles = async (req, res, next) => {
  try {
    const { q } = req.query;
    const whereClause = { user_id: req.user.id };

    const searchOp = (File.sequelize?.getDialect() === 'postgres') ? Op.iLike : Op.like;

    if (q && q.trim()) {
      whereClause.original_name = {
        [searchOp]: `%${q.trim()}%`,
      };
    }

    const files = await File.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: files,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mendapatkan detail file berdasarkan ID
 * GET /api/files/:id
 */
const getFileById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = await File.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File tidak ditemukan.',
      });
    }

    res.status(200).json({
      success: true,
      data: file,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mengunduh file
 * GET /api/files/:id/download
 */
const downloadFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = await File.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File tidak ditemukan.',
      });
    }

    // Pastikan file fisik ada di disk
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({
        success: false,
        message: 'File fisik tidak ditemukan di server.',
      });
    }

    res.download(file.path, file.original_name);
  } catch (error) {
    next(error);
  }
};

/**
 * Menghapus file
 * DELETE /api/files/:id
 */
const deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = await File.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File tidak ditemukan.',
      });
    }

    // Hapus file fisik di disk jika masih ada
    if (fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.warn(`Gagal menghapus file fisik ${file.path}:`, err.message);
      }
    }

    // Hapus record di database
    await file.destroy();

    res.status(200).json({
      success: true,
      message: 'File berhasil dihapus.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mendapatkan ringkasan statistik (jumlah file, total ukuran, jumlah catatan)
 * GET /api/files/stats/summary
 */
const getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const fileCount = await File.count({ where: { user_id: userId } });
    const noteCount = await Note.count({ where: { user_id: userId } });
    const totalSize = (await File.sum('size', { where: { user_id: userId } })) || 0;

    res.status(200).json({
      success: true,
      data: {
        fileCount,
        noteCount,
        totalSize: Number(totalSize),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadFiles,
  getFiles,
  getFileById,
  downloadFile,
  deleteFile,
  getStats,
};
