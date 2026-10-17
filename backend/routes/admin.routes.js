import { Router } from 'express';
import axios from 'axios';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import protect from '../middleware/auth.middleware.js';
import { centralGet, centralPost, sendCentralError } from '../services/central.service.js';
import { audienceCounts, createCampaign, listCampaigns, sendCampaignBatch } from '../services/campaign.service.js';
import isAdmin from '../middleware/admin.middleware.js';
import emailService from '../services/email.service.js';
import adminPermissions, { ADMIN_PAGES } from '../middleware/admin-permissions.middleware.js';
import {
  addEventGalleryImage,
  clearStudentFlag,
  deleteBlog,
  deleteEvent,
  deleteEventGalleryImage,
  deleteExecutive,
  getAcademicSettings,
  getFees,
  updateFees,
  getAdminSummary,
  getStudentFlags,
  listBlogs,
  listEvents,
  listExecutives,
  listExecutiveSessions,
  saveBlog,
  saveEvent,
  saveExecutive,
  updateAcademicSettings,
  upsertStudentFlag,
} from '../services/admin.service.js';

const router = Router();
const ID_SYSTEM_API = process.env.CENTRAL_API_URL || 'https://nacosid.tmb.it.com/api.php';
const API_KEY = process.env.ID_SYSTEM_API_KEY || 'NACOS_LASUSTECH_SECURE_API_KEY';

router.use(protect, isAdmin, adminPermissions);

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

router.get('/dashboard', async (req, res, next) => {
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

    const can = (page) => req.adminPermissions.includes('*') || req.adminPermissions.includes(page);
    res.json({
      stats: can('students') ? stats : null,
      students: can('students') && Array.isArray(students) ? students : [],
      flags: can('students') ? flags : [],
      executives: can('executives') ? executives : [],
      events: can('events') ? events : [],
      blogs: can('blogs') ? blogs : [],
      academicSettings: can('settings') ? academicSettings : null,
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
    const { session, semester, welcomeMessage } = req.body;

    if (!session || !semester) {
      res.status(422).json({ message: 'Session and semester are required.' });
      return;
    }

    const updated = await updateAcademicSettings({
      session: String(session).trim(),
      semester: String(semester).trim(),
      welcomeMessage: welcomeMessage === undefined ? undefined : String(welcomeMessage),
    });

    res.json(updated);
  } catch (error) {
    if (error.response?.data?.message) {
      res.status(error.response.status || 422).json({ message: error.response.data.message });
      return;
    }
    next(error);
  }
});

router.get('/settings/fees', async (_req, res, next) => {
  try {
    res.json(await getFees());
  } catch (error) {
    next(error);
  }
});

router.put('/settings/fees', async (req, res, next) => {
  try {
    const { idCardStalite, idCardFresher, dues } = req.body;
    const values = { idCardStalite, idCardFresher, dues };
    for (const [name, value] of Object.entries(values)) {
      if (value !== undefined && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
        res.status(422).json({ message: `Invalid amount for ${name}.` });
        return;
      }
    }
    res.json(await updateFees(values));
  } catch (error) {
    if (error.response?.data?.message) {
      res.status(error.response.status || 422).json({ message: error.response.data.message });
      return;
    }
    next(error);
  }
});

router.get('/executives', async (req, res, next) => {
  try {
    res.json(await listExecutives({ includeInactive: true, session: req.query.session || 'all' }));
  } catch (error) {
    next(error);
  }
});

router.get('/executives/sessions', async (_req, res, next) => {
  try {
    res.json(await listExecutiveSessions());
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

/* ==========================================
   Roles, freshers, ID cards, HOC items, email
   (all data lives in the central database via the PHP API)
   ========================================== */

const central = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error.response) {
      sendCentralError(res, error, 'Request failed.');
      return;
    }
    next(error);
  }
};

// Tag a student as HOC / Assistant HOC / an executive role / plain Student.
router.put('/students/:id/post', central(async (req, res) => {
  res.json(await centralPost('set_student_post', { id: req.params.id, post: req.body.post }));
}));

// Correct a student's department or level.
router.put('/students/:id/fields', central(async (req, res) => {
  const { department, level } = req.body;
  res.json(await centralPost('set_student_fields', {
    id: req.params.id,
    ...(department !== undefined ? { department } : {}),
    ...(level !== undefined ? { level } : {}),
  }));
}));

router.get('/freshers', central(async (_req, res) => {
  res.json(await centralGet('get_all_freshers'));
}));

router.post('/freshers/:id/matric', central(async (req, res) => {
  res.json(await centralPost('assign_fresher_matric', { fresher_id: req.params.id, matric_no: req.body.matric_no }));
}));

router.get('/id-requests', central(async (_req, res) => {
  res.json(await centralGet('get_id_requests'));
}));

router.put('/id-requests/:id/status', central(async (req, res) => {
  res.json(await centralPost('set_id_request_status', { id: req.params.id, status: req.body.status }));
}));

// Generates ID card PNG(s) (a ZIP when several) and streams the file back.
router.post('/id-cards/generate', async (req, res, next) => {
  try {
    const response = await axios.post(ID_SYSTEM_API, { ids: req.body.ids }, {
      params: { action: 'generate_cards' },
      headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' },
      responseType: 'arraybuffer',
      timeout: 120000,
    });
    res.set({
      'Content-Type': response.headers['content-type'],
      'Content-Disposition': response.headers['content-disposition'] || 'attachment',
    });
    res.send(Buffer.from(response.data));
  } catch (error) {
    if (error.response) {
      let message = 'Could not generate cards.';
      try {
        message = JSON.parse(Buffer.from(error.response.data).toString()).message || message;
      } catch (_) {}
      res.status(error.response.status).json({ message });
      return;
    }
    next(error);
  }
});

// HOC items across all levels (admin overview of what each class is being charged).
router.get('/hoc-items', central(async (req, res) => {
  res.json(await centralGet('hoc_items_list', { level: req.query.level, include_archived: 1 }));
}));

router.get('/hoc-items/:id/sales', central(async (req, res) => {
  res.json(await centralGet('hoc_item_sales', { id: req.params.id }));
}));

router.put('/hoc-items/:id/status', central(async (req, res) => {
  res.json(await centralPost('hoc_item_status', { id: req.params.id, status: req.body.status }));
}));

// ── Email manager ────────────────────────────────────────────────────────────
router.post('/email/audience-counts', central(async (req, res) => {
  res.json(await audienceCounts(req.body.audience || {}));
}));

router.get('/email/campaigns', central(async (_req, res) => {
  res.json(await listCampaigns());
}));

router.post('/email/campaigns', central(async (req, res) => {
  const { subject, body, audience } = req.body;
  res.status(201).json(await createCampaign({
    subject, body, audience: audience || {},
    sentBy: req.user?.username || req.user?.name || 'admin',
  }));
}));

router.post('/email/campaigns/:id/send-batch', central(async (req, res) => {
  res.json(await sendCampaignBatch(req.params.id));
}));

// ── Who am I (permissions drive which pages the admin screen shows) ──────────
router.get('/me', (req, res) => {
  const isSuper = req.user.admin_kind === 'super';
  res.json({
    super: isSuper,
    name: req.user.name,
    username: req.user.username,
    permissions: isSuper ? ADMIN_PAGES : req.adminPermissions,
  });
});

// ── Sub-admins (super admin only: 'admins' is not a page any sub-admin can hold) ──
router.get('/admins', central(async (_req, res) => {
  res.json(await centralGet('admin_access_list'));
}));

router.post('/admins', central(async (req, res) => {
  res.status(201).json(await centralPost('admin_access_set', {
    matric_no: req.body.matric_no,
    permissions: req.body.permissions,
    created_by: req.user?.username || 'admin',
  }));
}));

router.delete('/admins/:studentId', central(async (req, res) => {
  res.json(await centralPost('admin_access_remove', { student_id: req.params.studentId }));
}));

// Does the mail server accept our connection and login? Handy right after changing the mail settings.
router.get('/email-check', async (_req, res) => {
  res.json(await emailService.checkMail());
});

export default router;
