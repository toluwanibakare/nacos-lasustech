import { Router } from 'express';
import axios from 'axios';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import protect from '../middleware/auth.middleware.js';
import isAdmin from '../middleware/admin.middleware.js';
import {
  addEventGalleryImage,
  clearStudentFlag,
  deleteBlog,
  deleteEvent,
  deleteEventGalleryImage,
  deleteExecutive,
  getAcademicSettings,
  getAdminSummary,
  getStudentFlags,
  listBlogs,
  listEvents,
  listExecutives,
  saveBlog,
  saveEvent,
  saveExecutive,
  updateAcademicSettings,
  upsertStudentFlag,
} from '../services/admin.service.js';

const router = Router();
const ID_SYSTEM_API = 'https://nacosid.tmb.it.com/api.php';
const API_KEY = process.env.ID_SYSTEM_API_KEY || 'NACOS_LASUSTECH_SECURE_API_KEY';

router.use(protect, isAdmin);

const safeRemoteGet = async (action) => {
  try {
    const response = await axios.get(`${ID_SYSTEM_API}?action=${action}`, {
      headers: { 'X-API-KEY': API_KEY },
      timeout: 12000,
    });
    let data = response.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (_) {}
    }
    return data;
  } catch (_error) {
    return [];
  }
};

router.get('/dashboard', async (_req, res, next) => {
  try {
    const [students, flags, executives, events, blogs, academicSettings] = await Promise.all([
      safeRemoteGet('get_all_students'),
      getStudentFlags(),
      listExecutives({ includeInactive: true }),
      listEvents({ includeInactive: true }),
      listBlogs({ includeDrafts: true }),
      getAcademicSettings(),
    ]);

    const stats = await getAdminSummary({
      totalStudents: Array.isArray(students) ? students.length : 0,
    });

    res.json({
      stats,
      students: Array.isArray(students) ? students : [],
      flags,
      executives,
      events,
      blogs,
      academicSettings,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (_req, res, next) => {
  try {
    const students = await safeRemoteGet('get_all_students');
    const stats = await getAdminSummary({
      totalStudents: Array.isArray(students) ? students.length : 0,
    });
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

router.get('/students', async (_req, res, next) => {
  try {
    const [students, flags] = await Promise.all([
      safeRemoteGet('get_all_students'),
      getStudentFlags(),
    ]);

    const flagsByMatric = new Map(
      flags.map((flag) => [String(flag.matric_number).trim(), flag]),
    );

    const merged = Array.isArray(students)
      ? students.map((student) => {
          const matric =
            String(student.matric_number || student.matric_no || student.matric || '').trim();
          return {
            ...student,
            activeFlag: flagsByMatric.get(matric) || null,
          };
        })
      : [];

    res.json(merged);
  } catch (error) {
    next(error);
  }
});

router.get('/student-flags', async (_req, res, next) => {
  try {
    res.json(await getStudentFlags());
  } catch (error) {
    next(error);
  }
});

router.post('/students/flags', async (req, res, next) => {
  try {
    const { matric_number, student_name, reason, message } = req.body;

    if (!matric_number || !reason || !message) {
      res.status(422).json({ message: 'Matric number, reason, and message are required.' });
      return;
    }

    const flag = await upsertStudentFlag({
      matricNumber: String(matric_number).trim(),
      studentName: student_name || null,
      reason: String(reason).trim(),
      message: String(message).trim(),
      flaggedBy: req.user?.username || req.user?.name || 'admin',
    });

    res.json(flag);
  } catch (error) {
    next(error);
  }
});

router.delete('/students/flags/:id', async (req, res, next) => {
  try {
    await clearStudentFlag(req.params.id);
    res.json({ status: 'success' });
  } catch (error) {
    next(error);
  }
});

router.get('/settings/academic', async (_req, res, next) => {
  try {
    res.json(await getAcademicSettings());
  } catch (error) {
    next(error);
  }
});

router.put('/settings/academic', async (req, res, next) => {
  try {
    const { session, semester } = req.body;

    if (!session || !semester) {
      res.status(422).json({ message: 'Session and semester are required.' });
      return;
    }

    const updated = await updateAcademicSettings({
      session: String(session).trim(),
      semester: String(semester).trim(),
      updatedBy: req.user?.username || req.user?.name || 'admin',
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.get('/executives', async (_req, res, next) => {
  try {
    res.json(await listExecutives({ includeInactive: true }));
  } catch (error) {
    next(error);
  }
});

router.post('/executives', async (req, res, next) => {
  try {
    if (!req.body.name || !req.body.post || !req.body.level || !req.body.description) {
      res.status(422).json({ message: 'Name, post, level, and description are required.' });
      return;
    }
    res.json(await saveExecutive(req.body));
  } catch (error) {
    next(error);
  }
});

router.put('/executives/:id', async (req, res, next) => {
  try {
    res.json(await saveExecutive(req.body, req.params.id));
  } catch (error) {
    next(error);
  }
});

router.delete('/executives/:id', async (req, res, next) => {
  try {
    await deleteExecutive(req.params.id);
    res.json({ status: 'success' });
  } catch (error) {
    next(error);
  }
});

router.get('/events', async (_req, res, next) => {
  try {
    res.json(await listEvents({ includeInactive: true }));
  } catch (error) {
    next(error);
  }
});

router.post('/events', async (req, res, next) => {
  try {
    if (!req.body.slug || !req.body.title || !req.body.event_status || !req.body.description) {
      res.status(422).json({ message: 'Slug, title, status, and description are required.' });
      return;
    }
    res.json(await saveEvent(req.body));
  } catch (error) {
    next(error);
  }
});

router.put('/events/:id', async (req, res, next) => {
  try {
    res.json(await saveEvent(req.body, req.params.id));
  } catch (error) {
    next(error);
  }
});

router.delete('/events/:id', async (req, res, next) => {
  try {
    await deleteEvent(req.params.id);
    res.json({ status: 'success' });
  } catch (error) {
    next(error);
  }
});

router.post('/events/:id/gallery', async (req, res, next) => {
  try {
    if (!req.body.image_url) {
      res.status(422).json({ message: 'Image URL is required.' });
      return;
    }
    res.json(await addEventGalleryImage(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
});

router.delete('/events/:eventId/gallery/:imageId', async (req, res, next) => {
  try {
    await deleteEventGalleryImage(req.params.imageId);
    res.json({ status: 'success' });
  } catch (error) {
    next(error);
  }
});

router.get('/blogs', async (_req, res, next) => {
  try {
    res.json(await listBlogs({ includeDrafts: true }));
  } catch (error) {
    next(error);
  }
});

router.post('/blogs', async (req, res, next) => {
  try {
    if (!req.body.slug || !req.body.title || !req.body.excerpt || !req.body.content) {
      res.status(422).json({ message: 'Slug, title, excerpt, and content are required.' });
      return;
    }
    res.json(await saveBlog(req.body));
  } catch (error) {
    next(error);
  }
});

router.put('/blogs/:id', async (req, res, next) => {
  try {
    res.json(await saveBlog(req.body, req.params.id));
  } catch (error) {
    next(error);
  }
});

router.delete('/blogs/:id', async (req, res, next) => {
  try {
    await deleteBlog(req.params.id);
    res.json({ status: 'success' });
  } catch (error) {
    next(error);
  }
});

router.get('/payments', async (_req, res) => {
  const payments = await safeRemoteGet('get_all_payments');
  res.json(Array.isArray(payments) ? payments : []);
});

router.get('/messages', async (_req, res) => {
  const messages = await safeRemoteGet('get_messages');
  res.json(Array.isArray(messages) ? messages : []);
});

// Configure disk storage for uploads
// Prefer the configured uploads dir (e.g., Railway volume mount).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : (process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '../uploads'));

try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (_err) {
  console.warn('⚠️  Could not create uploads directory:', _err.message);
}

const diskStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'img-' + uniqueSuffix + ext);
  }
});

const diskUpload = multer({
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/upload', diskUpload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // On Vercel, files go to /tmp and are not publicly served.
  // For persistent storage, integrate Cloudinary or similar.
  const relativePath = 'uploads/' + req.file.filename;
  res.json({ status: 'success', path: relativePath });
});

export default router;
