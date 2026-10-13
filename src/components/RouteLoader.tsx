import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

// ── Only these paths get the navigation loader ────────────────────────────────
const LOADER_ROUTES = ["/users", "/email-campaigns"];

const RouteLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // true only when the current path matches one of the target routes
  const isEnabled = LOADER_ROUTES.some((path) =>
    location.pathname === path || location.pathname.startsWith(path + "/")
  );

  useEffect(() => {
    if (!isEnabled) return; // skip all other routes

    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, [location.pathname, isEnabled]);

  return (
    <div className="relative w-full h-full">
      {/* Page content always rendered — never unmounted */}
      {children}

      {/* Overlay only appears for LOADER_ROUTES */}
      {loading && isEnabled && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center
           backdrop-blur-md transition-opacity duration-300 animate-fadeIn">
          
          {/* Glass Card */}
          <div className="flex flex-col items-center gap-4 px-10 py-8
            backdrop-blur-lg animate-scaleIn">

            {/* Modern Spinner */}
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-purple-500 animate-spin" />
            </div>

            {/* Text */}
            <p className="text-sm font-semibold text-gray-600 tracking-wide">
              Loading...
            </p>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteLoader;
