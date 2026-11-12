import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Scrolls to the top of the page whenever the route path changes.
 * Skipped when the URL has a hash so in-page anchor links still work.
 * Skipped on browser Back/Forward (POP) so those land where the visitor was,
 * which also covers the first page load/reload (initial action is POP).
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (hash) return;
    if (navigationType === "POP") return;
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
};

export default ScrollToTop;
