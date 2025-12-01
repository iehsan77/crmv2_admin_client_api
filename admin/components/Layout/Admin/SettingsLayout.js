"use client";

//import { PageTitle, PageSubTitle } from "@/components/PageTitle";
import SettingsSidebar from "@/partials/settings/SettingsSidebar";

export default function SettingsLayout({ children }) {
  return (
    <>
      {/* <PageTitle title="Settings" /> */}
      <div className="page">
        <div className="w-full flex flex-col md:flex-row h-screen">
          <div className="w-full md:w-1/6 lg:w-1/8 bg-white border-r">
            <SettingsSidebar />
          </div>
          <div className="w-full md:w-4/6 lg:w-7/8 bg-white p-4">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
