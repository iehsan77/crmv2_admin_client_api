"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";

import {
  LuHeartHandshake,
  LuFileSpreadsheet,
  LuFileCheck2,
  LuBookUser,
  LuFileBadge2,
} from "react-icons/lu";
import { NotebookIcon, FileTextIcon, PaperclipIcon } from "lucide-react";

import RightSidebar from "@/partials/crm/common/RightSidebar";
import LeftSidebar from "@/partials/crm/contacts/view/LeftSidebar";

import useContactsStore from "@/stores/crm/useContactsStore";

const Layout = ({ children }) => {
  const { id } = useParams();
  const fetchRecordDetails = useContactsStore((s) => s.fetchRecordDetails);
  const recordDetails = useContactsStore((s) => s.recordDetails);

  // ✅ Stable callback to fetch contact details
  const fetchRecord = useCallback(() => {
    if (id) fetchRecordDetails(id);
  }, [id, fetchRecordDetails]);

  // ✅ Fetch record when ID changes
  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);


// ✅ Memoize links to avoid unnecessary recalculations
  const links = useMemo(
    () => [
      {
        label: "Leads",
        count: recordDetails?.leads?.length || 0,
        icon: LuBookUser,
      },
      {
        label: "Contacts",
        count: recordDetails?.contacts?.length || 0,
        icon: LuBookUser,
      },
      {
        label: "Deals",
        count: recordDetails?.deals?.length || 0,
        icon: LuHeartHandshake,
      },
      {
        label: "Accounts",
        count: recordDetails?.accounts?.length || 0,
        icon: LuHeartHandshake,
      },
      {
        label: "Invoices",
        count: recordDetails?.invoices?.length || 0,
        icon: FileTextIcon,
      },
      {
        label: "Quotes",
        count: recordDetails?.quotes?.length || 0,
        icon: LuFileSpreadsheet,
      },
      {
        label: "Orders",
        count: recordDetails?.orders?.length || 0,
        icon: LuFileCheck2,
      },
      {
        label: "Bookings",
        count: recordDetails?.bookings?.length || 0,
        icon: NotebookIcon,
      },
      {
        label: "Attachments",
        count: recordDetails?.attachments?.length || 0,
        icon: PaperclipIcon,
      },
    ],
    [recordDetails]
  );


  return (
    <div className="flex h-full gap-4">
      {/* Left Sidebar (profile or summary) */}
      <div className="shrink-0">
        <LeftSidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">{children}</div>

      {/* Right Sidebar (quick links accordion) */}
      <div className="shrink-0">
        <RightSidebar links={links} />
      </div>
    </div>
  );
};

export default Layout;
