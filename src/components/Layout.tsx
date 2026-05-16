import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ children, noReveal }: { children: ReactNode, noReveal?: boolean }) => {
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";

  return (
    <div className="flex min-h-screen flex-col">
      {!isDashboard && <Navbar />}
      <main className={`flex-1 ${!noReveal ? 'animate-reveal' : ''}`}>{children}</main>
      {!isDashboard && <Footer />}
    </div>
  );
};

export default Layout;
