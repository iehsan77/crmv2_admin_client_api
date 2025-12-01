// TopNavLeft.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";
import useUserStore from "@/stores/useUserStore";

export default function TopNavLeft() {
  const pathname = usePathname();
  const appSlug = useMemo(() => pathname?.split("/")?.[1] || "", [pathname]);
  const currentModuleSlug = useMemo(
    () => pathname?.split("/")?.[2] || "",
    [pathname]
  );

  const { getCurrentAppBySlug, setUserModulesUrls, user, can } = useUserStore();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentApp, setCurrentApp] = useState(null);

  useEffect(() => {
    if (appSlug) {
      const app = getCurrentAppBySlug(appSlug);
      setCurrentApp(app);
    }
  }, [appSlug, getCurrentAppBySlug]);

  useEffect(() => {
    if (currentApp?.modules?.length) {
      const urls = currentApp.modules.reduce((acc, module) => {
        acc[module.slug] = module.custom_view_url;
        return acc;
      }, {});
      setUserModulesUrls(urls);
    }
  }, [currentApp]);

  const filteredModules = useMemo(() => {
    if (!user?.permissions || !currentApp?.modules) return [];
    return currentApp.modules.filter((module) => can(`${module.slug}:view`));
  }, [user?.permissions, currentApp]);

  const renderNavLinks = (isMobile = false) =>
    filteredModules.map((module) => (
      <a
        key={module.id}
/*
        href={
          module?.app_id > 1
            ? `/${currentApp.slug}/${module.slug}`
            : `/${currentApp.slug}/${module.slug}/${module.custom_view_url}`
        }
*/                
        href={`/${currentApp.slug}/${module.slug}`}

        className={`${
          isMobile
            ? "block py-2 text-dark"
            : "px-4 py-2 hover:text-primary hover:font-medium text-sm"
        } ${
          !isMobile && module.slug === currentModuleSlug
            ? "text-primary font-medium border-b-2 border-[#2575D6] h-full flex items-center"
            : ""
        } font-medium`}
      >
        {module.title}
      </a>
    ));

  return (
    <div className="flex h-full items-center gap-2">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-2 h-4" />

      {/* Desktop Nav */}
      <div className="hidden lg:flex items-center h-full">{renderNavLinks()}</div>

      {/* Mobile Hamburger */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="lg:hidden text-sm font-medium"
      >
        <span className="material-icons">menu</span>
      </button>

      {/* Mobile Navigation */}
      <div
        className={`lg:hidden bg-white shadow-lg p-4 absolute top-14 left-0 right-0 ${
          isMenuOpen ? "block" : "hidden"
        }`}
      >
        {renderNavLinks(true)}
      </div>
    </div>
  );
}


// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { SidebarTrigger } from "@/components/ui/sidebar";
// import { usePathname } from "next/navigation";
// import useUserStore from "@/stores/useUserStore";

// export default function TopNavLeft() {
//   const pathname = usePathname();
//   const appSlug = useMemo(() => pathname?.split("/")?.[1] || "", [pathname]);
//   const currentModuleSlug = useMemo(
//     () => pathname?.split("/")?.[2] || "",
//     [pathname]
//   );

//   const { getCurrentAppBySlug, setUserModulesUrls, user, can } = useUserStore(); // ✅ Make sure this is at the top level

//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [currentApp, setCurrentApp] = useState(null);

//   useEffect(() => {
//     if (appSlug) {
//       const app = getCurrentAppBySlug(appSlug);
//       setCurrentApp(app);
//     }
//   }, [appSlug, getCurrentAppBySlug]);

//   useEffect(() => {
//     if (currentApp?.modules?.length) {
//       const urls = currentApp.modules.reduce((acc, module) => {
//         acc[module.slug] = module.custom_view_url;
//         return acc;
//       }, {});
//       setUserModulesUrls(urls);
//     }
//   }, [currentApp]);

//   const filteredModules = useMemo(() => {
//     if (!user?.permissions || !currentApp?.modules) return [];
//     return currentApp.modules.filter((module) => can(`${module.slug}:view`));
//   }, [user?.permissions, currentApp]);

//   const renderNavLinks = (isMobile = false) =>
//     filteredModules.map((module, i) => (
//       <React.Fragment key={i}>
//         {module?.app_id > 1 ? (
//           <a
//             key={module.id}
//             href={`/${currentApp.slug}/${module.slug}`}
//             className={`${
//               isMobile ? "block py-2 text-dark" : " hover:text-gray-600"
//             } ${
//               !isMobile && module.slug === currentModuleSlug ? "underline" : ""
//             }`}
//           >
//             {module.title}
//           </a>
//         ) : (
//           <a
//             key={module.id}
//             href={`/${currentApp.slug}/${module.slug}/${module.custom_view_url}`}
//             className={`${
//               isMobile ? "block py-2 text-dark" : " hover:text-gray-600"
//             } ${
//               !isMobile && module.slug === currentModuleSlug ? "underline" : ""
//             }`}
//           >
//             {module.title}
//           </a>
//         )}
//       </React.Fragment>
//     ));

//   return (
//     <div>
//       <nav className="container mx-auto flex justify-between items-center p-3">
//         <SidebarTrigger className=" me-4" />

//         {/* Mobile Menu Button */}
//         <button
//           onClick={() => setIsMenuOpen(!isMenuOpen)}
//           className="lg:hidden "
//         >
//           <span className="material-icons">menu</span>
//         </button>

//         {/* Desktop Navbar */}
//         <div className="hidden lg:flex space-x-6">{renderNavLinks()}</div>
//       </nav>

//       {/* Mobile Navigation */}
//       <div
//         className={`lg:hidden bg-gray-100 shadow-lg p-4 ${
//           isMenuOpen ? "block" : "hidden"
//         }`}
//       >
//         {renderNavLinks(true)}
//       </div>
//     </div>
//   );
// }
