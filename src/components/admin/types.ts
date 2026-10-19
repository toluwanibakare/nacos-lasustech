export type SectionKey =
  | "overview"
  | "students"
  | "freshers"
  | "idcards"
  | "payments"
  | "email"
  | "settings"
  | "executives"
  | "events"
  | "blogs"
  | "messages"
  | "admins";

export interface Student {
  id: number | string;
  full_name: string;
  level: string; // '100'..'400' | 'alumni'
  department: string | null;
  email: string | null;
  email_verified?: number | boolean | null;
  whatsapp_number?: string | null;
  dues_exempt?: boolean | number | string;
  gender?: string | null;
  birthday?: string | null;
  post: string | null;
  matric_no: string | null;
  image_path?: string | null;
  is_generated?: number | boolean | null;
  created_at?: string;
  activeFlag?: StudentFlag | null;
}

export interface StudentFlag {
  id: number | string;
  reason: string;
  message: string;
  matric_number?: string;
}

export interface Fresher {
  id: number | string;
  full_name: string;
  email: string;
  department: string | null;
  whatsapp_number?: string | null;
  email_verified?: number | boolean | null;
  status: "pending_verification" | "active" | "promoted" | "disabled" | string;
  matric_no: string | null;
  image_path?: string | null;
  created_at?: string;
}

export type IdStatus = "awaiting_payment" | "pending" | "processing" | "ready" | "collected";

export interface IdRequest {
  id: number | string;
  student_id: number | string | null;
  fresher_id: number | string | null;
  account_type: "student" | "fresher";
  full_name: string;
  matric_number: string | null;
  birthday?: string | null;
  fee_amount: number | string | null;
  status: IdStatus | string;
  payment_reference?: string | null;
  passport_url?: string | null;
  created_at?: string;
  department?: string | null;
  level?: string | null;
  is_generated?: number | boolean | null;
  has_matric: number | boolean | null;
  dues_exempt?: number | boolean | string | null;
  dues_paid?: number | boolean | string | null;
}

export interface Payment {
  id: number | string;
  student_id: number | string | null;
  fresher_id: number | string | null;
  full_name: string | null;
  matric_no: string | null;
  account_type: string | null;
  amount: number | string;
  reference: string;
  status: string;
  payment_type: string;
  session: string | null;
  hoc_item_id: number | string | null;
  item_title: string | null;
  created_at: string;
}

export interface AcademicSettings {
  session: string;
  semester: string;
  welcomeMessage: string;
  communityLink?: string;
  classLinks?: Record<string, string>;
}

export interface FeeSettings {
  session: string;
  idCardStalite: number;
  idCardFresher: number;
  dues: number;
  departments: string[];
}

export interface AdminStats {
  totalStudents?: number;
  flaggedStudents?: number;
  executives?: number;
  activeEvents?: number;
  publishedBlogs?: number;
  currentSession?: string;
  currentSemester?: string;
}

export interface Executive {
  id: number | string;
  name: string;
  post: string;
  level: string;
  session?: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: boolean | number;
}

export interface GalleryImage {
  id: number | string;
  image_url: string;
  caption?: string | null;
}

export interface EventItem {
  id: number | string;
  slug: string;
  title: string;
  event_status: string;
  start_date: string;
  end_date: string;
  location: string;
  description: string;
  cover_image_url: string;
  registration_url: string;
  flyer_folder: string;
  sort_order: number;
  is_active: boolean | number;
  gallery?: GalleryImage[];
}

export interface Blog {
  id: number | string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  image_url: string;
  published_at: string;
  is_published: boolean | number;
}

export interface ContactMessage {
  id: number | string;
  kind?: "message" | "suggestion" | "complaint";
  is_anonymous?: number | boolean | string;
  full_name?: string;
  email?: string;
  subject?: string;
  message?: string;
  created_at?: string;
}

export interface AdminDashboard {
  stats: AdminStats;
  students: Student[];
  flags: StudentFlag[];
  executives: Executive[];
  events: EventItem[];
  blogs: Blog[];
  academicSettings: AcademicSettings;
}

export type AudienceType = "all" | "alumni" | "fresher" | "stalite" | "level" | "department" | "level_department";

export interface Audience {
  type: AudienceType;
  level?: string;
  department?: string;
}

export interface AudienceCounts {
  total: number;
  with_email: number;
}

export interface Campaign {
  id: number | string;
  subject: string;
  audience_type: string;
  audience_level?: string | null;
  audience_department?: string | null;
  total_students: number;
  with_email: number;
  sent_count: number;
  failed_count: number;
  status: string;
  sent_by?: string | null;
  created_at: string;
  sent_at?: string | null;
}

export interface HocItem {
  id: number | string;
  level: string;
  department: string | null;
  title: string;
  course_code: string | null;
  description: string | null;
  price: number | string;
  session: string;
  status: string;
  buyers: number;
  revenue: number;
}
