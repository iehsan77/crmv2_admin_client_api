import Button from "@/components/Button";
import { Plus } from "lucide-react";
import React, { useState, useEffect } from "react";
import AttachmentsTabs from "@/partials/customers/profile/activity/attachements/AttachmentsTabs";
import { useDrawer } from "@/context/drawer-context";
import AttachmentAddEditForm from "./AttachmentAddEditForm";
import { DataTable } from "@/components/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";

import Link from "next/link";

import {formatDate} from "@/helper/GeneralFunctions"

import useUserStore from "@/stores/useUserStore";

const Attachements = ({ attachments, loading }) => {
  const { showDrawer } = useDrawer();

  console.log("received attachments")
  console.log(attachments)

  const { user } = useUserStore();

  const [currentTab, setCurrentTab] = useState("business_documents");
  const [currentTabData, setCurrentTabData] = useState([]);

  //const { attachments } = useAttachmentsStore();

  console.log("received currentTabData")
  console.log(currentTabData)

  const columns = [
    {
      accessorKey: "id",
      header: "ID",
      size: 80,
      cell: ({ row }) => (
        <span className="text-[#1E3A8A] hover:underline cursor-pointer whitespace-nowrap">
          {row.original?.id}
        </span>
      ),
    },
    {
      accessorKey: "file_name",
      header: "File Name",
      size: 250,
      minSize: 200,
      cell: ({ row }) => (
        <Link href={row?.original?.file_url} target="_blank">
          <div className="flex items-center gap-2">
            <Icon icon="ph:folders" width={18} height={18} />{" "}
            {row.original?.file_name}
          </div>
        </Link>
      ),
    },
    {
      accessorKey: "attached_by",
      header: "Attached By",
      size: 200,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {user?.first_name + " " + user?.last_name}
        </span>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      size: 180,
      cell: ({ row }) => (
        <span className="text-gray-600 whitespace-nowrap">
          {formatDate(row.original?.attached_date)}
        </span>
      ),
    },
    {
      accessorKey: "size",
      header: "Size",
      size: 120,
      cell: ({ row }) => (
        <span className="text-gray-700">{row.original?.file_size}</span>
      ),
    },
  ];

  useEffect(() => {
    if (attachments && currentTab) {
      setCurrentTabData(attachments[currentTab]);
    }
  }, [attachments, currentTab, setCurrentTabData]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-medium text-gray-900">Attachments</h1>
        <div className="space-x-2">
          <Button
            onClick={() =>
              showDrawer({
                title: "Add Attachment",
                size: "xl",
                content: <AttachmentAddEditForm />,
              })
            }
          >
            <Plus />
            Add Attachments
          </Button>
        </div>
      </div>

      <AttachmentsTabs
        availableTabs={[
          { label: "Business Documents", value: "business_documents" },
          { label: "Vehicle Documents", value: "vehicle_documents" },
          { label: "Booking Documents", value: "booking_documents" },
          { label: "Miscellaneous", value: "miscellaneous" },
        ]}
        initialTabs={[
          { label: "Business Documents", value: "business_documents" },
          { label: "Vehicle Documents", value: "vehicle_documents" },
          { label: "Booking Documents", value: "booking_documents" },
          { label: "Miscellaneous", value: "miscellaneous" },
        ]}
        tabIcon="flat-color-icons:folder"
        onTabChange={(key) => setCurrentTab(key)}
        showAddView={false}
        allowClose={false}
      />

      <Card>
        <CardContent>
          <DataTable columns={columns} data={currentTabData} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Attachements;
