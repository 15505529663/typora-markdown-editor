import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ensureMarkdownExtension,
  getAvailableFileName,
  isAllowedImportExtension,
  resolveSafeNotePath,
  sanitizeFileName,
  validateRawFileName,
} from './pathSafe.ts';
import { createAssetsRouter } from './assets.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const NOTES_DIR = path.resolve(__dirname, '../notes');
const { router: assetsRouter, assetsDir: ASSETS_DIR } = createAssetsRouter(NOTES_DIR);

// 简单的 API Key 保护，防止公网未授权访问
// 在生产环境下，建议将其放入 .env 文件
const ACCESS_TOKEN = 'markedit_secret_2024'; 

fs.ensureDirSync(NOTES_DIR);
fs.ensureDirSync(ASSETS_DIR);

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Auth Middleware
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers['x-access-token'];
  if (token === ACCESS_TOKEN) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized: Invalid Access Token' });
  }
};

// Apply auth to all /api routes
app.use('/api', authMiddleware);
app.use('/api/assets', assetsRouter);
app.use('/assets', express.static(ASSETS_DIR, {
  fallthrough: false,
  maxAge: '1h',
}));

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

app.get('/api/files', async (_req, res) => {
  try {
    await fs.ensureDir(NOTES_DIR);
    const files = await fs.readdir(NOTES_DIR);
    const mdFiles = await Promise.all(
      files
        .filter((file) => file.toLowerCase().endsWith('.md'))
        .map(async (file) => {
          const stat = await fs.stat(path.join(NOTES_DIR, file));
          return {
            name: file,
            path: file,
            updatedAt: stat.mtime,
          };
        })
    );

    mdFiles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.json(mdFiles);
  } catch (error) {
    res.status(500).json({ success: false, error: '读取文件列表失败' });
  }
});

app.get('/api/files/:filename', async (req, res) => {
  try {
    const { filePath } = resolveSafeNotePath(NOTES_DIR, req.params.filename);
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ success: false, error: '文件不存在' });
    }

    const content = await fs.readFile(filePath, 'utf-8');
    res.json({ success: true, content });
  } catch (error) {
    res.status(400).json({ success: false, error: getErrorMessage(error, '读取文件失败') });
  }
});

app.post('/api/files', async (req, res) => {
  try {
    const { name, content = '', create = false } = req.body as {
      name?: string;
      content?: string;
      create?: boolean;
    };

    const validationError = validateRawFileName(name || '');
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const normalizedName = ensureMarkdownExtension(sanitizeFileName(name || ''));
    const { fileName, filePath } = resolveSafeNotePath(NOTES_DIR, normalizedName);

    if (create && await fs.pathExists(filePath)) {
      return res.status(409).json({ success: false, error: '文件已存在' });
    }

    await fs.ensureDir(NOTES_DIR);
    await fs.writeFile(filePath, content, 'utf-8');
    res.json({ success: true, data: { fileName, path: fileName } });
  } catch (error) {
    res.status(500).json({ success: false, error: getErrorMessage(error, '保存文件失败') });
  }
});

app.post('/api/files/import', async (req, res) => {
  try {
    const { fileName, content = '', overwrite = false } = req.body as {
      fileName?: string;
      content?: string;
      overwrite?: boolean;
    };

    if (!fileName || !fileName.trim()) {
      return res.status(400).json({ success: false, error: '文件名不能为空' });
    }

    if (!isAllowedImportExtension(fileName)) {
      return res.status(400).json({ success: false, error: '仅支持导入 .md、.markdown、.txt 文件' });
    }

    const validationError = validateRawFileName(fileName);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const sanitized = sanitizeFileName(fileName);
    const targetName = overwrite ? ensureMarkdownExtension(sanitized) : await getAvailableFileName(NOTES_DIR, sanitized);
    const { fileName: safeFileName, filePath } = resolveSafeNotePath(NOTES_DIR, targetName);

    if (!overwrite && await fs.pathExists(filePath)) {
      return res.status(409).json({ success: false, error: '文件已存在' });
    }

    await fs.ensureDir(NOTES_DIR);
    await fs.writeFile(filePath, content, 'utf-8');
    res.json({ success: true, data: { fileName: safeFileName, path: safeFileName } });
  } catch (error) {
    res.status(500).json({ success: false, error: getErrorMessage(error, '导入文件失败') });
  }
});

app.put('/api/files/:filename', async (req, res) => {
  try {
    const { newName } = req.body as { newName?: string };
    const validationError = validateRawFileName(newName || '');
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const oldPath = resolveSafeNotePath(NOTES_DIR, req.params.filename).filePath;
    const { fileName, filePath: newPath } = resolveSafeNotePath(NOTES_DIR, ensureMarkdownExtension(sanitizeFileName(newName || '')));

    if (!await fs.pathExists(oldPath)) {
      return res.status(404).json({ success: false, error: '文件不存在' });
    }

    if (await fs.pathExists(newPath)) {
      return res.status(409).json({ success: false, error: '文件已存在' });
    }

    await fs.rename(oldPath, newPath);
    res.json({ success: true, data: { fileName, path: fileName } });
  } catch (error) {
    res.status(500).json({ success: false, error: getErrorMessage(error, '重命名失败') });
  }
});

app.delete('/api/files/:filename', async (req, res) => {
  try {
    const { filePath } = resolveSafeNotePath(NOTES_DIR, req.params.filename);
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ success: false, error: '文件不存在' });
    }

    await fs.remove(filePath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: getErrorMessage(error, '删除失败') });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
