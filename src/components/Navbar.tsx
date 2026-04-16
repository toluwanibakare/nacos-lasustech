import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  LogIn,
  ChevronRight,
  Home,
  Users,
  CalendarDays,
  FileText,
  CreditCard,
  IdCard,
  BookOpen,
  Phone,
  LogOut,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginModal from "@/components/LoginModal";

import nacosLogo from "@/assets/nacos_logo.png";
import lasustechLogo from "@/assets/lasustech_logo.png";

const navLinks = [
  { label: "Home", path: "/", icon: Home },
  { label: "Executives", path: "/executives", icon: Users },
  { label: "Events", path: "/events", icon: CalendarDays },
  { label: "Blog", path: "/blog", icon: FileText }, // changed
  // { label: "Dues", path: "/dues", icon: CreditCard },
  // { label: "ID Card", path: "/id-card", icon: IdCard },
  { label: "Constitution", path: "/constitution", icon: BookOpen },
  { label: "Contact", path: "/contact", icon: Phone },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  // Handle outside click for profile menu
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (profileMenuOpen && !target.closest(".profile-menu-container")) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [profileMenuOpen]);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border/70 bg-white/88 backdrop-blur-xl">
        <div className="container">
          <div className="flex h-16 items-center justify-between lg:h-[76px]">

            {/* Logo + Name */}
            <div className="flex items-center gap-3">
              <a 
                href="https://nacos.org.ng" 
                target="_blank" 
                rel="noopener noreferrer"
                title="NACOS NATIONAL"
                className="transition-opacity hover:opacity-80"
              >
                <img
                  src={nacosLogo}
                  alt="NACOS NATIONAL"
                  className="h-7 sm:h-10 w-auto object-contain transition-transform hover:scale-105"
                />
              </a>

              <a 
                href="https://lasustech.edu.ng" 
                target="_blank" 
                rel="noopener noreferrer"
                title="LASUSTECH"
                className="transition-opacity hover:opacity-80"
              >
                <img
                  src={lasustechLogo}
                  alt="LASUSTECH"
                  className="h-7 sm:h-10 w-auto object-contain transition-transform hover:scale-105"
                />
              </a>

              <Link to="/" className="ml-1 flex flex-col leading-tight cursor-pointer">
                <span className="font-display text-[12px] sm:text-sm font-bold tracking-tight text-foreground uppercase">
                  NACOS LASUSTECH
                </span>
                <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Chapter
                </span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden items-center rounded-full border border-border/70 bg-background/80 p-1 lg:flex">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                const Icon = link.icon;

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition ${
                      isActive
                        ? "bg-accent text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              {localStorage.getItem("isLoggedIn") === "true" ? (
                <div className="flex items-center gap-3">
                  <div className="relative group profile-menu-container">
                    <button 
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                      className="flex h-10 w-10 overflow-hidden rounded-full border-2 border-primary/20 transition-all hover:border-primary/50"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100&auto=format&fit=crop"
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    </button>
                    {/* Simplified Dropdown */}
                    {(profileMenuOpen || false) && (
                      <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-border bg-card p-2 shadow-xl animate-reveal lg:group-hover:block">
                        <Link 
                          to="/dashboard" 
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-accent"
                        >
                          Dashboard
                        </Link>
                        <button 
                          onClick={() => {
                            localStorage.removeItem("isLoggedIn");
                            window.location.href = "/";
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setLoginOpen(true)}
                  className="hidden h-10 gap-2 rounded-full bg-[#1F5FAF] px-4 text-xs font-semibold text-white hover:bg-[#184d90] sm:inline-flex"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Login
                </Button>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background lg:hidden"
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile */}
        {/* Mobile */}
        <div 
          className={`fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
            mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
        />

        <div 
          className={`fixed inset-x-0 top-0 z-50 transform border-b border-border/70 bg-white/95 backdrop-blur-xl transition-transform duration-500 ease-out lg:hidden ${
            mobileOpen ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="container py-6">
            <div className="flex items-center justify-between pb-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                {localStorage.getItem("isLoggedIn") === "true" ? (
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100&auto=format&fit=crop"
                      alt="Profile"
                      className="h-10 w-10 rounded-full border-2 border-primary/20 object-cover"
                    />
                    <div className="flex flex-col">
                      <span className="font-display font-bold text-sm">Toluwani Moses</span>
                      <span className="text-[10px] text-muted-foreground font-medium">Verified Member</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <img src={nacosLogo} alt="Logo" className="h-8 w-auto" />
                      <span className="font-display font-bold text-xs mt-1">NACOS LASUSTECH</span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Chapter</span>
                    </div>
                  </>
                )}
              </div>
              <button 
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 grid gap-2">
              {navLinks.map((link, i) => {
                const isActive = location.pathname === link.path;
                const Icon = link.icon;

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    style={{ transitionDelay: `${i * 50}ms` }}
                    className={`flex items-center justify-between rounded-2xl px-5 py-4 transition-all duration-300 ${
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    } ${mobileOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        isActive ? "bg-white/20" : "bg-primary/10 text-primary"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-semibold">{link.label}</span>
                    </div>
                    <ChevronRight className={`h-4 w-4 ${isActive ? "opacity-100" : "opacity-30"}`} />
                  </Link>
                );
              })}
            </div>

            <div className={`mt-8 pt-6 border-t border-border/50 transition-all duration-500 delay-300 ${
              mobileOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}>
              {localStorage.getItem("isLoggedIn") === "true" ? (
                <Button
                  onClick={() => {
                    localStorage.removeItem("isLoggedIn");
                    window.location.href = "/";
                  }}
                  className="h-14 w-full gap-3 rounded-2xl bg-red-500 text-base font-bold text-white shadow-xl shadow-red-500/20 hover:bg-red-600"
                >
                  <LogOut className="h-5 w-5" />
                  Logout Account
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setMobileOpen(false);
                    setLoginOpen(true);
                  }}
                  className="h-14 w-full gap-3 rounded-2xl bg-[#1F5FAF] text-base font-bold text-white shadow-xl shadow-blue-500/20 hover:bg-[#184d90]"
                >
                  <LogIn className="h-5 w-5" />
                  Access Member Portal
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
};

export default Navbar;