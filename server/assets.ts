import crypto from 'crypto';
import express from 'express';
import fs from 'fs-extra';
import multer from 'multer';
import path from 'path';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
]);

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const formatDatePart = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
};

const getSafeImageExtension = (file: Express.Multer.File) => {
  const originalExt = path.extname(file.originalname || '').toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(originalExt)) {
    return originalExt;
  }

  return IMAGE_EXTENSIONS[file.mimetype] || '.png';
};

const ensureInsideDirectory = (directory: string, targetPath: string) => {
  const relative = path.relative(directory, targetPath);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
};

export const createAssetsRouter = (notesDir: string) => {
  const router = express.Router();
  const assetsDir = path.resolve(notesDir, 'assets');
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
    fileFilter: (_req, file, callback) => {
      if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
        callback(new Error('仅支持 PNG、JPG、GIF、WebP 图片'));
        return;
      }
      callback(null, true);
    },
  });

  router.post('/upload', (req, res) => {
    upload.single('file')(req, res, async (error) => {
      try {
        if (error) {
          const message = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
            ? '图片不能超过 10MB'
            : error instanceof Error
              ? error.message
              : '图片上传失败';
          return res.status(400).json({ success: false, error: message });
        }

        const file = req.file;
        if (!file) {
          return res.status(400).json({ success: false, error: '请选择要上传的图片' });
        }

        if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
          return res.status(400).json({ success: false, error: '仅支持 PNG、JPG、GIF、WebP 图片' });
        }

        await fs.ensureDir(assetsDir);

        const extension = getSafeImageExtension(file);
        const fileName = `image-${formatDatePart(new Date())}-${crypto.randomBytes(4).toString('hex')}${extension}`;
        const targetPath = path.resolve(assetsDir, fileName);

        if (!ensureInsideDirectory(assetsDir, targetPath)) {
          return res.status(400).json({ success: false, error: '非法文件路径' });
        }

        await fs.writeFile(targetPath, file.buffer);

        return res.json({
          success: true,
          data: {
            fileName,
            relativePath: `./assets/${fileName}`,
          },
        });
      } catch (saveError) {
        return res.status(500).json({
          success: false,
          error: saveError instanceof Error ? saveError.message : '图片上传失败',
        });
      }
    });
  });

  return { router, assetsDir };
};
