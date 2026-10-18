const fs = require('fs');
const path = require('path');
const { File, Note } = require('../models');
const { uploadDir } = require('../middleware/upload');

/**
 * Export semua file dan catatan dalam format JSON (sesuai spesifikasi PRD v1.1)
 * GET /api/backup/export
 */
const exportData = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const files = await File.findAll({
      where: { user_id: userId },
      order: [['created_at', 'ASC']],
    });

    const notes = await Note.findAll({
      where: { user_id: userId },
      order: [['created_at', 'ASC']],
    });

    // Format data files
    const exportFiles = [];
    for (const f of files) {
      let base64Data = '';
      if (fs.existsSync(f.path)) {
        const buffer = fs.readFileSync(f.path);
        base64Data = buffer.toString('base64');
      }

      exportFiles.push({
        name: f.original_name,
        type: f.mime_type,
        size: Number(f.size),
        date: new Date(f.createdAt).getTime(),
        data: base64Data,
      });
    }

    // Format data notes
    const exportNotes = notes.map((n) => ({
      title: n.title,
      content: n.content,
      date: new Date(n.createdAt).getTime(),
    }));

    const backupPayload = {
      app: 'HomeStorage',
      version: '1.1',
      exportedAt: new Date().toISOString(),
      files: exportFiles,
      notes: exportNotes,
    };

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `home-storage-backup-${dateStr}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(JSON.stringify(backupPayload, null, 2));
  } catch (error) {
    next(error);
  }
};

/**
 * Import data dari JSON backup (Fase restore)
 * POST /api/backup/import
 */
const importData = async (req, res, next) => {
  try {
    const { files, notes } = req.body;
    const userId = req.user.id;

    let importedFilesCount = 0;
    let importedNotesCount = 0;

    // Import files jika ada
    if (Array.isArray(files)) {
      for (const item of files) {
        if (!item.name || !item.data) continue;

        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(item.name);
        const storedName = `imported-${uniqueSuffix}${ext}`;
        const filePath = path.join(uploadDir, storedName);

        // Decode base64 dan simpan ke file
        const buffer = Buffer.from(item.data, 'base64');
        fs.writeFileSync(filePath, buffer);

        await File.create({
          user_id: userId,
          original_name: item.name,
          stored_name: storedName,
          mime_type: item.type || 'application/octet-stream',
          size: item.size || buffer.length,
          path: filePath,
        });

        importedFilesCount++;
      }
    }

    // Import notes jika ada
    if (Array.isArray(notes)) {
      for (const n of notes) {
        if (!n.title && !n.content) continue;

        await Note.create({
          user_id: userId,
          title: n.title || '',
          content: n.content || '',
        });

        importedNotesCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Berhasil mengimpor ${importedFilesCount} file dan ${importedNotesCount} catatan.`,
      data: {
        importedFiles: importedFilesCount,
        importedNotes: importedNotesCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  exportData,
  importData,
};
