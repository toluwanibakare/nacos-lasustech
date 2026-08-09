import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Scroll instantly, bypassing smooth scrolling that might conflict with layout shifts
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // Fallback for slower renders
    const timeout = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 50);

    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
