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
const BACKUPS_DIR = path.join(NOTES_DIR, '.backups');
const { router: assetsRouter, assetsDir: ASSETS_DIR } = createAssetsRouter(NOTES_DIR);

// 简单的 API Key 保护，防止公网未授权访问
// 在生产环境下，建议将其放入 .env 文件
const ACCESS_TOKEN = 'markedit_secret_2024'; 

fs.ensureDirSync(NOTES_DIR);
fs.ensureDirSync(ASSETS_DIR);
fs.ensureDirSync(BACKUPS_DIR);

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

const makeBackupName = (fileName: string) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${fileName}.${timestamp}.md`;
};

const resolveSafeBackupPath = (backupName: string) => {
  const targetPath = path.resolve(BACKUPS_DIR, path.basename(backupName));
  const relative = path.relative(BACKUPS_DIR, targetPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('非法备份路径');
  }
  return targetPath;
};

const cleanupBackups = async (fileName: string, maxBackups: number) => {
  await fs.ensureDir(BACKUPS_DIR);
  const backups = await Promise.all(
    (await fs.readdir(BACKUPS_DIR))
      .filter((name) => name.startsWith(`${fileName}.`) && name.endsWith('.md'))
      .map(async (name) => ({
        name,
        path: path.join(BACKUPS_DIR, name),
        stat: await fs.stat(path.join(BACKUPS_DIR, name)),
      }))
  );

  await Promise.all(backups
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)
    .slice(Math.max(1, maxBackups))
    .map((backup) => fs.remove(backup.path)));
};

const createBackupBeforeWrite = async (
  fileName: string,
  filePath: string,
  nextContent: string,
  maxBackups: number
) => {
  if (!await fs.pathExists(filePath)) return;
  const previousContent = await fs.readFile(filePath, 'utf-8');
  if (previousContent === nextContent) return;

  await fs.ensureDir(BACKUPS_DIR);
  const backupName = makeBackupName(fileName);
  await fs.writeFile(resolveSafeBackupPath(backupName), previousContent, 'utf-8');
  await cleanupBackups(fileName, maxBackups);
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

    const [content, stat] = await Promise.all([
      fs.readFile(filePath, 'utf-8'),
      fs.stat(filePath),
    ]);
    res.json({ success: true, content, updatedAt: stat.mtime.toISOString(), updatedAtMs: stat.mtimeMs });
  } catch (error) {
    res.status(400).json({ success: false, error: getErrorMessage(error, '读取文件失败') });
  }
});

app.get('/api/files/:filename/backups', async (req, res) => {
  try {
    const { fileName } = resolveSafeNotePath(NOTES_DIR, req.params.filename);
    await fs.ensureDir(BACKUPS_DIR);
    const backups = await Promise.all(
      (await fs.readdir(BACKUPS_DIR))
        .filter((name) => name.startsWith(`${fileName}.`) && name.endsWith('.md'))
        .map(async (name) => {
          const stat = await fs.stat(path.join(BACKUPS_DIR, name));
          return {
            name,
            updatedAt: stat.mtime.toISOString(),
          };
        })
    );

    backups.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.json({ success: true, data: backups });
  } catch (error) {
    res.status(400).json({ success: false, error: getErrorMessage(error, '读取备份失败') });
  }
});

app.post('/api/files/:filename/restore-backup', async (req, res) => {
  try {
    const { backupName } = req.body as { backupName?: string };
    const { fileName, filePath } = resolveSafeNotePath(NOTES_DIR, req.params.filename);
    if (!backupName || !backupName.startsWith(`${fileName}.`)) {
      return res.status(400).json({ success: false, error: '非法备份名称' });
    }

    const backupPath = resolveSafeBackupPath(backupName);
    if (!await fs.pathExists(backupPath)) {
      return res.status(404).json({ success: false, error: '备份不存在' });
    }

    await createBackupBeforeWrite(fileName, filePath, await fs.readFile(backupPath, 'utf-8'), 5);
    await fs.copy(backupPath, filePath);
    res.json({ success: true, data: { fileName, path: fileName } });
  } catch (error) {
    res.status(500).json({ success: false, error: getErrorMessage(error, '恢复备份失败') });
  }
});

app.post('/api/files', async (req, res) => {
  try {
    const { name, content = '', create = false } = req.body as {
      name?: string;
      content?: string;
      create?: boolean;
      backup?: boolean;
      maxBackups?: number;
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
    if (req.body.backup) {
      await createBackupBeforeWrite(fileName, filePath, content, Number(req.body.maxBackups) || 5);
    }
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
