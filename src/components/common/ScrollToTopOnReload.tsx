// ScrollToTopOnReload.tsx
import { useEffect } from "react";
import { useLocation } from "react-router";

const ScrollToTopOnReload = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [pathname]);

  // Disable browser scroll restoration on reload
  useEffect(() => {
    window.history.scrollRestoration = "manual";
  }, []);

  return null;
};

export default ScrollToTopOnReload;
