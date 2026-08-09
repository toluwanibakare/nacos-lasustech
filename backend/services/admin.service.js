import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ID_SYSTEM_API = 'https://nacosid.tmb.it.com/api.php';
const API_KEY = process.env.ID_SYSTEM_API_KEY || 'NACOS_LASUSTECH_SECURE_API_KEY';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// On Vercel, filesystem is read-only except /tmp. Data won't persist
// between invocations on Vercel — defaults will be used each time.
const STORE_DIR = process.env.VERCEL
  ? '/tmp/data'
  : path.join(__dirname, '../data');
const STORE_FILE = path.join(STORE_DIR, 'admin_store.json');

// Ensure local store directory exists (safe on all environments)
try {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
} catch (_err) {
  console.warn('⚠️  Could not create data store directory:', _err.message);
}

/* ==========================================
   DEFAULT STATIC DATA (Matches Public Front End)
   ========================================== */

const defaultExecutives = [
  {
    id: "exec-1",
    name: "Shofunde Jubril Ajibola",
    post: "President",
    level: "400 Level",
    description: "Serves as the primary leader and official representative of the NACOS LASUSTECH Chapter, overseeing all activities and strategic growth.",
    image_url: "uploads/president.jpg",
    sort_order: 1,
    is_active: 1
  },
  {
    id: "exec-2",
    name: "Bakare Toluwani Moses",
    post: "Vice President",
    level: "300 Level",
    description: "Acts as the chief assistant to the President, coordinating administrative programs and ensuring organizational stability.",
    image_url: "uploads/vice_president.jpg",
    sort_order: 2,
    is_active: 1
  },
  {
    id: "exec-3",
    name: "Owolabi Grace Oluwafunmilayo",
    post: "Lady Vice-President",
    level: "200 Level",
    description: "Focuses on the empowerment and representation of female students within the computing community and supporting top-level initiatives.",
    image_url: "uploads/lady_vice.jpeg",
    sort_order: 3,
    is_active: 1
  },
  {
    id: "exec-4",
    name: "Oladepo Damilare David",
    post: "General Secretary",
    level: "300 Level",
    description: "The custodian of chapter records, responsible for official documentation, correspondence, and meeting coordination.",
    image_url: "uploads/gensec.jpeg",
    sort_order: 4,
    is_active: 1
  },
  {
    id: "exec-5",
    name: "Emmanuel Ariyo Ogunfunwa",
    post: "Assistant General Secretary",
    level: "200 Level",
    description: "Supports the General Secretary in administrative duties and ensures continuous documentation of chapter affairs.",
    image_url: "uploads/ass_gensec.jpg",
    sort_order: 5,
    is_active: 1
  },
  {
    id: "exec-6",
    name: "Onaade Abdulmuqtadir Ayomide",
    post: "Financial Secretary",
    level: "300 Level",
    description: "Maintains accurate financial records, manages budget allocations, and ensures financial transparency across all chapter projects.",
    image_url: "uploads/finsec.jpg",
    sort_order: 6,
    is_active: 1
  },
  {
    id: "exec-7",
    name: "Ebhojie Oluwadamilola",
    post: "Treasurer",
    level: "300 Level",
    description: "Oversees the chapter's treasury, managing funds, ensuring secure disbursements, and providing detailed financial reports.",
    image_url: "uploads/treasurer.jpeg",
    sort_order: 7,
    is_active: 1
  },
  {
    id: "exec-8",
    name: "Aladekoye Samuel",
    post: "Public Relations Officer",
    level: "100 Level",
    description: "The official spokesperson for the chapter, managing media relations, brand image, and external communications.",
    image_url: "uploads/pro.jpg",
    sort_order: 8,
    is_active: 1
  },
  {
    id: "exec-9",
    name: "Fatai Adewale",
    post: "Social Director",
    level: "300 Level",
    description: "Organizes social events, workshops, and recreational activities to foster a strong sense of community and networking.",
    image_url: "uploads/social_director.png",
    sort_order: 9,
    is_active: 1
  },
  {
    id: "exec-10",
    name: "Egba Uthman Temitayo",
    post: "Sport Director",
    level: "200 Level",
    description: "Coordinates athletic events and fitness programs to promote physical well-being and department-wide team spirit.",
    image_url: "uploads/sports.jpg",
    sort_order: 10,
    is_active: 1
  },
  {
    id: "exec-11",
    name: "Oluwatobi Oluwaseyi Isaac",
    post: "Welfare Director",
    level: "400 Level",
    description: "Monitors and ensures the general well-being and support of all computing students within the chapter.",
    image_url: "uploads/welfare.jpeg",
    sort_order: 11,
    is_active: 1
  },
  {
    id: "exec-12",
    name: "Olagunju Basheer Olaniyi",
    post: "Electoral Chairman / HOC 400L",
    level: "400 Level",
    description: "Leads the senior class and oversees the integrity and execution of the chapter's electoral processes.",
    image_url: "uploads/hoc_400.jpg",
    sort_order: 12,
    is_active: 1
  },
  {
    id: "exec-13",
    name: "Adegoke Muhammed",
    post: "HOC for 300 level",
    level: "300 Level",
    description: "Serves as the primary link between the 300 level students and the executive council, managing class-specific affairs.",
    image_url: "uploads/hoc_300.jpg",
    sort_order: 13,
    is_active: 1
  },
  {
    id: "exec-14",
    name: "Osho Aishat",
    post: "HOC for 200 level",
    level: "200 Level",
    description: "Coordinates academic and social activities for the 200 level class, ensuring their voices are heard in the chapter.",
    image_url: "uploads/hoc_200.jpg",
    sort_order: 14,
    is_active: 1
  },
  {
    id: "exec-15",
    name: "Ayara Michael",
    post: "HOC for 100 level",
    level: "100 Level",
    description: "Guides and represents the path of year-one students, helping them integrate into the NACOS community.",
    image_url: "uploads/hoc_100.jpeg",
    sort_order: 15,
    is_active: 1
  },
  {
    id: "exec-16",
    name: "Adebisi Emmanuel Oluwatobi",
    post: "Assistant HOC for 400L",
    level: "400 Level",
    description: "Assists the 400L HOC in class management and leadership duties for the graduating class.",
    image_url: "uploads/asshoc_400.jpg",
    sort_order: 16,
    is_active: 1
  },
  {
    id: "exec-17",
    name: "Matti Jadesola",
    post: "Assistant HOC for 300level",
    level: "300 Level",
    description: "Provides administrative support to the 300L HOC and class activities.",
    image_url: "uploads/asshoc_300.jpeg",
    sort_order: 17,
    is_active: 1
  },
  {
    id: "exec-18",
    name: "Samuel John",
    post: "Assistant HOC for 200L",
    level: "200 Level",
    description: "Supports class coordination and member welfare for the 200 level students.",
    image_url: "uploads/asshoc_200.jpg",
    sort_order: 18,
    is_active: 1
  },
  {
    id: "exec-19",
    name: "Olatunji Oyindamola Barakat",
    post: "Assistant HOC 100lvl",
    level: "100 Level",
    description: "Assists the 100L HOC in welcoming and organizing the newest members of the chapter.",
    image_url: "uploads/asshoc_100.jpeg",
    sort_order: 19,
    is_active: 1
  }
];

const defaultEvents = [
  {
    id: "hod-cup-finale",
    title: "HOD'S CUP: THE GRAND FINALE",
    event_status: "past",
    start_date: "2026-05-07T12:00",
    end_date: "2026-05-07T15:00",
    location: "LASUSTECH Main Field",
    description: "The ultimate glory awaits! Join us for the 3rd Place Match (100L vs 200L) at 12:00 NOON and the Final Match (300L vs 400L) at 1:30 PM. Venue: LASUSTECH Main Field.",
    cover_image_url: "uploads/final_fixture.jpg",
    sort_order: 1,
    is_active: 1,
    gallery: []
  },
  {
    id: "ladies-in-tech",
    title: "LADIES IN TECH EVENT",
    event_status: "past",
    start_date: "2026-05-01T20:00",
    end_date: "2026-05-01T22:00",
    location: "Google Meet",
    description: "Theme: Overcoming fear and imposter syndrome. Featuring guest speakers Agape Oluwa, Mujisatullahi Bakare, and Naheemat Akinyemi A. Hosted by Owolabi Grace (Lady Vice). Join us on Google Meet at 8:00 PM. Contact the PRO (+234 810 563 8170) for more info.",
    cover_image_url: "uploads/PHOTO-2026-04-29-09-06-01.jpg",
    sort_order: 2,
    is_active: 1,
    gallery: []
  },
  {
    id: "hod-cup",
    title: "HOD'S CUP 2025/2026",
    event_status: "past",
    start_date: "2026-04-22T08:00",
    end_date: "2026-05-07T18:00",
    location: "LASUSTECH",
    description: "The annual HOD'S CUP featuring Football, Chess, and Scrabble. A month of intense competition where the department's best athletes battled for glory.",
    cover_image_url: "uploads/PHOTO-2026-04-24-17-16-18.jpg",
    sort_order: 3,
    is_active: 1,
    gallery: []
  },
  {
    id: "bootcamp-onboarding",
    title: "NACOS Tech Upscaling Bootcamp Onboarding",
    event_status: "past",
    start_date: "2026-04-29T10:00",
    end_date: "2026-04-29T12:00",
    location: "LASUSTECH",
    description: "The official onboarding session for the NACOS Upscaling Bootcamp, introducing students to advanced computing tracks and industry mentorship.",
    cover_image_url: "uploads/PHOTO-2026-04-28-12-14-22.jpg",
    sort_order: 4,
    is_active: 1,
    gallery: []
  }
];

/* ==========================================
   LOCAL JSON DB STORE HANDLERS
   ========================================== */

const getStore = () => {
  if (!fs.existsSync(STORE_FILE)) {
    const initialStore = {
      academicSettings: {
        session: '2025/2026',
        semester: 'First Semester',
      },
      executives: defaultExecutives,
      events: defaultEvents,
      blogs: [],
      studentFlags: [],
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initialStore, null, 2), 'utf8');
    return initialStore;
  }
  
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('⚠️ local JSON store parsing failed:', err.message);
    return {
      academicSettings: { session: '2025/2026', semester: 'First Semester' },
      executives: defaultExecutives,
      events: defaultEvents,
      blogs: [],
      studentFlags: [],
    };
  }
};

const saveStore = (data) => {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('⚠️ local JSON store saving failed:', err.message);
  }
};

/* ==========================================
   API HELPER & image path normalization
   ========================================== */

const getHeaders = () => ({
  'X-API-KEY': API_KEY,
  'Content-Type': 'application/json',
});

const remotePost = async (action, payload = {}) => {
  try {
    await axios.post(ID_SYSTEM_API, payload, {
      headers: getHeaders(),
      params: { action },
      timeout: 5000,
    });
  } catch (err) {
    console.warn(`⚠️ Central server background post failed for ${action}:`, err.message);
  }
};

const normalizeImagePath = (pathStr) => {
  if (!pathStr) return '';
  
  if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) {
    const parts = pathStr.split('/uploads/');
    if (parts.length > 1) {
      return 'uploads/' + parts[1];
    }
    const filename = pathStr.substring(pathStr.lastIndexOf('/') + 1);
    return 'uploads/' + filename;
  }
  
  let clean = pathStr.replace(/^[/\\]+/, '');
  
  if (!clean.startsWith('uploads/')) {
    const filename = clean.substring(clean.lastIndexOf('/') + 1);
    return 'uploads/' + filename;
  }
  
  return clean;
};

/* ==========================================
   1. ACADEMIC SETTINGS SERVICES
   ========================================== */

export const getAcademicSettings = async () => {
  const store = getStore();
  return store.academicSettings;
};

export const updateAcademicSettings = async ({ session, semester, updatedBy }) => {
  const store = getStore();
  store.academicSettings = { session, semester };
  saveStore(store);
  
  // Background call to central API
  remotePost('update_academic_settings', { session, semester, updated_by: updatedBy });
  
  return store.academicSettings;
};

/* ==========================================
   2. STUDENT FLAGS SERVICES
   ========================================== */

export const getStudentFlags = async () => {
  const store = getStore();
  return store.studentFlags || [];
};

export const getStudentFlagByMatric = async (matricNumber) => {
  const store = getStore();
  const flags = store.studentFlags || [];
  return flags.find(f => String(f.matric_number).trim() === String(matricNumber).trim() && f.status === 'active') || null;
};

export const upsertStudentFlag = async ({
  matricNumber,
  studentName,
  reason,
  message,
  flaggedBy,
}) => {
  const store = getStore();
  if (!store.studentFlags) store.studentFlags = [];
  
  const existingIndex = store.studentFlags.findIndex(
    f => String(f.matric_number).trim() === String(matricNumber).trim() && f.status === 'active'
  );
  
  const flagObj = {
    id: existingIndex !== -1 ? store.studentFlags[existingIndex].id : Date.now(),
    matric_number: matricNumber,
    student_name: studentName,
    reason,
    message,
    flagged_by: flaggedBy,
    status: 'active',
    created_at: existingIndex !== -1 ? store.studentFlags[existingIndex].created_at : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existingIndex !== -1) {
    store.studentFlags[existingIndex] = flagObj;
  } else {
    store.studentFlags.push(flagObj);
  }
  
  saveStore(store);
  
  remotePost('upsert_student_flag', flagObj);
  
  return flagObj;
};

export const clearStudentFlag = async (id) => {
  const store = getStore();
  if (!store.studentFlags) store.studentFlags = [];
  
  const existingIndex = store.studentFlags.findIndex(f => String(f.id) === String(id));
  if (existingIndex !== -1) {
    store.studentFlags[existingIndex].status = 'resolved';
    store.studentFlags[existingIndex].updated_at = new Date().toISOString();
    saveStore(store);
  }
  
  remotePost('clear_student_flag', { id });
};

/* ==========================================
   3. EXECUTIVES SERVICES
   ========================================== */

export const listExecutives = async ({ includeInactive = false } = {}) => {
  const store = getStore();
  const excos = store.executives || [];
  
  const items = includeInactive ? excos : excos.filter(e => e.is_active === 1 || e.is_active === true);
  return items.map(item => ({
    ...item,
    image_url: normalizeImagePath(item.image_url || item.image),
    image: item.image || item.image_url || '',
  }));
};

export const saveExecutive = async (payload, id = null) => {
  const store = getStore();
  if (!store.executives) store.executives = [];
  
  const normalized = {
    ...payload,
    image_url: normalizeImagePath(payload.image_url || payload.image),
    image: normalizeImagePath(payload.image || payload.image_url),
    is_active: payload.is_active === false ? 0 : 1,
    sort_order: Number(payload.sort_order || 0),
  };

  if (id) {
    const idx = store.executives.findIndex(e => String(e.id) === String(id));
    if (idx !== -1) {
      store.executives[idx] = { ...store.executives[idx], ...normalized, id };
    }
  } else {
    normalized.id = 'exec-' + Date.now();
    store.executives.push(normalized);
  }
  
  saveStore(store);
  
  remotePost('save_executive', { ...normalized, id });
  
  return listExecutives({ includeInactive: true });
};

export const deleteExecutive = async (id) => {
  const store = getStore();
  if (!store.executives) store.executives = [];
  store.executives = store.executives.filter(e => String(e.id) !== String(id));
  saveStore(store);
  
  remotePost('delete_executive', { id });
};

/* ==========================================
   4. EVENTS & GALLERY SERVICES
   ========================================== */

export const listEvents = async ({ includeInactive = false } = {}) => {
  const store = getStore();
  const events = store.events || [];
  
  const items = includeInactive ? events : events.filter(e => e.is_active === 1 || e.is_active === true);
  return items.map(item => ({
    ...item,
    cover_image_url: normalizeImagePath(item.cover_image_url || item.image || item.cover_image || ''),
    gallery: Array.isArray(item.gallery) ? item.gallery.map(img => ({
      ...img,
      image_url: normalizeImagePath(img.image_url || img.image || ''),
    })) : [],
  }));
};

export const saveEvent = async (payload, id = null) => {
  const store = getStore();
  if (!store.events) store.events = [];
  
  const normalized = {
    ...payload,
    cover_image_url: normalizeImagePath(payload.cover_image_url || payload.image),
    is_active: payload.is_active === false ? 0 : 1,
    sort_order: Number(payload.sort_order || 0),
  };

  if (id) {
    const idx = store.events.findIndex(e => String(e.id) === String(id));
    if (idx !== -1) {
      store.events[idx] = { ...store.events[idx], ...normalized, id };
    }
  } else {
    normalized.id = 'event-' + Date.now();
    normalized.gallery = [];
    store.events.push(normalized);
  }
  
  saveStore(store);
  
  remotePost('save_event', { ...normalized, id });
  
  return listEvents({ includeInactive: true });
};

export const deleteEvent = async (id) => {
  const store = getStore();
  if (!store.events) store.events = [];
  store.events = store.events.filter(e => String(e.id) !== String(id));
  saveStore(store);
  
  remotePost('delete_event', { id });
};

export const addEventGalleryImage = async (eventId, payload) => {
  const store = getStore();
  if (!store.events) store.events = [];
  
  const idx = store.events.findIndex(e => String(e.id) === String(eventId));
  if (idx !== -1) {
    if (!store.events[idx].gallery) store.events[idx].gallery = [];
    
    const normalizedImage = {
      id: 'gallery-' + Date.now(),
      image_url: normalizeImagePath(payload.image_url || payload.image),
      caption: payload.caption || '',
      sort_order: Number(payload.sort_order || 0),
    };
    
    store.events[idx].gallery.push(normalizedImage);
    saveStore(store);
    
    remotePost('add_event_gallery', { event_id: eventId, ...normalizedImage });
  }
  
  return listEvents({ includeInactive: true });
};

export const deleteEventGalleryImage = async (imageId) => {
  const store = getStore();
  if (!store.events) store.events = [];
  
  for (let i = 0; i < store.events.length; i++) {
    if (store.events[i].gallery) {
      const originalLen = store.events[i].gallery.length;
      store.events[i].gallery = store.events[i].gallery.filter(img => String(img.id) !== String(imageId));
      if (store.events[i].gallery.length !== originalLen) {
        saveStore(store);
        break;
      }
    }
  }
  
  remotePost('delete_event_gallery', { id: imageId });
};

/* ==========================================
   5. BLOG SERVICES
   ========================================== */

export const listBlogs = async ({ includeDrafts = false } = {}) => {
  const store = getStore();
  const blogs = store.blogs || [];
  
  const items = includeDrafts ? blogs : blogs.filter(b => b.is_published === 1 || b.is_published === true);
  return items.map(item => ({
    ...item,
    image_url: normalizeImagePath(item.image_url || item.image || ''),
  }));
};

export const saveBlog = async (payload, id = null) => {
  const store = getStore();
  if (!store.blogs) store.blogs = [];
  
  const normalized = {
    ...payload,
    image_url: normalizeImagePath(payload.image_url || payload.image),
    is_published: payload.is_published === false ? 0 : 1,
  };

  if (id) {
    const idx = store.blogs.findIndex(b => String(b.id) === String(id));
    if (idx !== -1) {
      store.blogs[idx] = { ...store.blogs[idx], ...normalized, id };
    }
  } else {
    normalized.id = 'blog-' + Date.now();
    normalized.published_at = new Date().toISOString();
    store.blogs.push(normalized);
  }
  
  saveStore(store);
  
  remotePost('save_blog', { ...normalized, id });
  
  return listBlogs({ includeDrafts: true });
};

export const deleteBlog = async (id) => {
  const store = getStore();
  if (!store.blogs) store.blogs = [];
  store.blogs = store.blogs.filter(b => String(b.id) !== String(id));
  saveStore(store);
  
  remotePost('delete_blog', { id });
};

/* ==========================================
   6. ADMIN DASHBOARD SUMMARY
   ========================================== */

export const getAdminSummary = async ({ totalStudents = 0 } = {}) => {
  const [flagged, executives, events, blogs, settings] = await Promise.all([
    getStudentFlags().catch(() => []),
    listExecutives().catch(() => []),
    listEvents().catch(() => []),
    listBlogs().catch(() => []),
    getAcademicSettings().catch(() => ({ session: '2025/2026', semester: 'First Semester' })),
  ]);

  return {
    totalStudents,
    flaggedStudents: Array.isArray(flagged) ? flagged.filter(f => f.status === 'active').length : 0,
    executives: Array.isArray(executives) ? executives.length : 0,
    activeEvents: Array.isArray(events) ? events.length : 0,
    publishedBlogs: Array.isArray(blogs) ? blogs.length : 0,
    currentSession: settings.session || '2025/2026',
    currentSemester: settings.semester || 'First Semester',
  };
};
