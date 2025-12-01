import React from "react";
import ProfileCard from "@/partials/affiliates/profile/ProfileCard";

const Layout = ({ children }) => {
  return (
    <div className="flex h-full gap-4 min-h-0">
      {/* Sidebar-like profile card */}
      <div className="shrink-0">
        <ProfileCard />
      </div>
      
      {/* Main content scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default Layout;

 