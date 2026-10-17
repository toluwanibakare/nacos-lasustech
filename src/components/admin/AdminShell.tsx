import { ReactNode, useState } from "react";
import {
  BarChart3, BookOpen, Calendar, CreditCard, GraduationCap, IdCard, LogOut, Mail, Menu, MessageSquare, Settings, ShieldCheck, Sparkles, UserCog, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import logo from "@/assets/nacos_logo.png";
import { SectionKey } from "./types";

export const NAV: { id: SectionKey; label: string; icon: typeof Users }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "students", label: "Students", icon: Users },
  { id: "freshers", label: "Freshers", icon: Sparkles },
  { id: "idcards", label: "ID Cards", icon: IdCard },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "email", label: "Email", icon: Mail },
  { id: "settings", label: "Academic & Fees", icon: Settings },
  { id: "executives", label: "Executives", icon: ShieldCheck },
  { id: "events", label: "Events", icon: Calendar },
  { id: "blogs", label: "Blogs", icon: BookOpen },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "admins", label: "Admins", icon: UserCog },
];

const NavList = ({ active, onSelect, allowed }: { active: SectionKey; onSelect: (id: SectionKey) => void; allowed: SectionKey[] }) => (
  <nav className="space-y-1">
    {NAV.filter((item) => allowed.includes(item.id)).map((item) => (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelect(item.id)}
        className={cn(
          "flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left text-sm transition",
          active === item.id ? "bg-white font-semibold text-[#062018]" : "text-white/70 hover:bg-white/10 hover:text-white",
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.label}
      </button>
    ))}
  </nav>
);

export const AdminShell = ({
  active,
  onSelect,
  allowed,
  adminName,
  onLogout,
  children,
}: {
  active: SectionKey;
  onSelect: (id: SectionKey) => void;
  allowed: SectionKey[];
  adminName?: string;
  onLogout: () => void;
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7f2]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#062018] px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/10 hover:text-white lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <img src={logo} alt="NACOS" className="h-8 w-8 rounded-full bg-white object-contain p-0.5" />
          <span className="text-sm font-bold tracking-wide">NACOS LASUSTECH</span>
          <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          {adminName && <span className="hidden text-xs text-white/70 sm:inline">{adminName}</span>}
          <Button variant="outline" size="sm" className="rounded-full border-white/25 bg-transparent text-white hover:bg-white hover:text-[#062018]" onClick={onLogout}>
            <LogOut className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1500px] flex-1 gap-6 px-4 py-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-20 rounded-3xl bg-[#0f3b2c] p-3">
            <NavList active={active} onSelect={onSelect} allowed={allowed} />
          </div>
        </aside>
        <main className="min-w-0 flex-1 pb-6">{children}</main>
      </div>

      <footer className="border-t border-[#0f3b2c]/10 px-4 py-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} NACOS LASUSTECH. All rights reserved.
      </footer>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-0 bg-[#062018] p-4 text-white">
          <SheetTitle className="mb-4 flex items-center gap-2 text-white">
            <GraduationCap className="h-5 w-5" /> Admin menu
          </SheetTitle>
          <NavList active={active} onSelect={(id) => { onSelect(id); setOpen(false); }} allowed={allowed} />
        </SheetContent>
      </Sheet>
    </div>
  );
};

