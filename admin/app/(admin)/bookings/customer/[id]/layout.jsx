"use client";

import { useEffect } from "react";

import CustomerQuickLinksAccordion from "@/partials/customers/profile/CustomerQuickLinksAccordion";
import ProfileCard from "@/partials/customers/profile/ProfileCard";

import { useParams } from "next/navigation";
import useCustomersStore from "@/stores/customers/useCustomersStore";

const Layout = ({ children }) => {
  const { id } = useParams();
  const { fetchCustomer } = useCustomersStore();

  useEffect(() => {
    if (id) fetchCustomer(id);
  }, [id, fetchCustomer]);

  return (
    <div className="flex h-full gap-4">
      {/* Left Sidebar Profile */}
      <div className="shrink-0">
        <ProfileCard />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>

      {/* Right Sidebar Quick Links */}
      <div className="shrink-0">
        <CustomerQuickLinksAccordion />
      </div>
    </div>
  );
};

export default Layout;
