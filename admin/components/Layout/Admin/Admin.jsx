// app/layout.jsx
"use client";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

import AdminSidebar from "@/components/Layout/Admin/AdminSidebar";
import TopNav from "@/components/Layout/Admin/TopNav";

import "@/lib/globals";

export default function Admin({ children }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AdminSidebar />
       <SidebarInset>
          <TopNav />
          <div className="flex flex-1 flex-col">
            <div className="@container/main p-8 flex flex-1 flex-col gap-2">
              {children}
            </div>
          </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
