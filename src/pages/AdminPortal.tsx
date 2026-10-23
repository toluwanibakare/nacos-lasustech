import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_UNAUTHORIZED_EVENT, adminFetch, clearAdminSession } from "@/lib/admin-api";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLogin, AdminUser } from "@/components/admin/AdminLogin";
import { Spinner } from "@/components/admin/shared";
import AdminErrorBoundary from "@/components/admin/AdminErrorBoundary";
import { SectionKey } from "@/components/admin/types";

const sections: Record<SectionKey, React.LazyExoticComponent<() => JSX.Element>> = {
  overview: lazy(() => import("@/components/admin/Overview")),
  students: lazy(() => import("@/components/admin/Students")),
  freshers: lazy(() => import("@/components/admin/Freshers")),
  idcards: lazy(() => import("@/components/admin/IdCards")),
  payments: lazy(() => import("@/components/admin/Payments")),
  email: lazy(() => import("@/components/admin/EmailManager")),
  settings: lazy(() => import("@/components/admin/AcademicSettings")),
  executives: lazy(() => import("@/components/admin/Executives")),
  events: lazy(() => import("@/components/admin/Events")),
  blogs: lazy(() => import("@/components/admin/Blogs")),
  messages: lazy(() => import("@/components/admin/Messages")),
  birthdays: lazy(() => import("@/components/admin/Birthdays")),
  admins: lazy(() => import("@/components/admin/Admins")),
};

const ALL_SECTIONS = Object.keys(sections) as SectionKey[];

/** The super admin sees everything; a sub-admin sees only the pages they were given. */
const allowedSections = (user: AdminUser | null): SectionKey[] => {
  if (!user) return [];
  if (user.super) return ALL_SECTIONS;
  return ALL_SECTIONS.filter((key) => key !== "overview" && key !== "admins" && key !== "birthdays" && (user.permissions || []).includes(key));
};

const readSession = (): AdminUser | null => {
  try {
    if (!localStorage.getItem("adminToken")) return null;
    const raw = localStorage.getItem("adminUser");
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
};

const AdminPortalInner = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<AdminUser | null>(readSession);
  const [active, setActive] = useState<SectionKey>(() => allowedSections(readSession())[0] || "overview");

  const signOut = useCallback(() => {
    clearAdminSession();
    setUser(null);
  }, []);

  // Any admin request that returns 401 clears the session and shows the sign-in screen.
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      toast({ title: "Session expired", description: "Please sign in again.", variant: "destructive" });
    };
    window.addEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
  }, [toast]);

  // Re-read the permissions from the server so changes take effect without signing in again.
  useEffect(() => {
    if (!user) return;
    adminFetch("/admin/me")
      .then((me: { super: boolean; permissions: string[]; name?: string; username?: string }) => {
        const next: AdminUser = { ...user, super: me.super, permissions: me.permissions };
        localStorage.setItem("adminUser", JSON.stringify(next));
        setUser((cur) => (cur ? next : cur));
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.username]);

  const allowed = allowedSections(user);
  useEffect(() => {
    if (user && allowed.length && !allowed.includes(active)) setActive(allowed[0]);
  }, [user, allowed.join(","), active]);

  if (!user) return <AdminLogin onSignedIn={(u) => { setUser(u); setActive(allowedSections(u)[0] || "overview"); }} />;

  if (allowed.length === 0) {
    return (
      <AdminShell active={active} onSelect={setActive} allowed={[]} adminName={user.name || user.username} onLogout={() => { signOut(); }}>
        <div className="rounded-3xl bg-white p-8 text-sm text-muted-foreground">You do not have access to any admin page yet. Ask the super admin to give you access.</div>
      </AdminShell>
    );
  }

  const Section = sections[active];
  return (
    <AdminShell active={active} onSelect={setActive} allowed={allowed} adminName={user.name || user.username} onLogout={() => { signOut(); toast({ title: "Signed out" }); }}>
      <AdminErrorBoundary key={active} label="This section">
        <Suspense fallback={<Spinner />}>
          <Section />
        </Suspense>
      </AdminErrorBoundary>
    </AdminShell>
  );
};

// The outer boundary catches failures in the shell or sign-in screen as well.
const AdminPortal = () => (
  <AdminErrorBoundary label="The admin">
    <AdminPortalInner />
  </AdminErrorBoundary>
);

export default AdminPortal;
