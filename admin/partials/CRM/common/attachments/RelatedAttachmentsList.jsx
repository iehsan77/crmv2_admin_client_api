"use client";
import React, { useState, useEffect, useMemo } from "react";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { Plus } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import Button from "@/components/Button";
import CardActions from "./CardActions";

import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";
import { formatDate, useSegment, getthiFileIcon } from "@/helper/GeneralFunctions";

import useUserStore from "@/stores/useUserStore";
import useAttachmentsStore from "@/stores/crm/useAttachmentsStore";

const RelatedAttachmentsList = () => {
  const { user } = useUserStore();

  const source_module = useSegment(1);
  const source_module_id = useSegment(3);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const records = useAttachmentsStore((s) => s.records);
  const loading = useAttachmentsStore((s) => s.loading);
  const fetchRecords = useAttachmentsStore((s) => s.fetchRecords);

  // 🔹 Fetch API on mount
  useEffect(() => {
    fetchRecords({
      related_to: source_module,
      related_to_id: source_module_id,
    });
  }, [fetchRecords, source_module, source_module_id]);

  // 🔹 Pagination calculations
  const totalPages = records?.length ? Math.ceil(records.length / itemsPerPage) : 1;
  const currentData = records.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // 🔹 Columns with serial number
  const columns = useMemo(
    () => [
      {
        id: "serial",
        header: () => <div className="text-center">#</div>,
        cell: ({ row }) => {
          const serial = (currentPage - 1) * itemsPerPage + (row.index + 1);
          return <span className="block text-center">{serial}</span>;
        },
      },
      {
        accessorKey: "file_name",
        header: "File Name",
        size: 250,
        cell: ({ row }) => (
          <Link href={row?.original?.file_url} target="_blank">
            <div className="flex items-center gap-2">
              <Icon icon={getthiFileIcon(row.original?.file_extention)} width={18} height={18} />
              {row.original?.file_name}
            </div>
          </Link>
        ),
      },
      {
        accessorKey: "attached_by",
        header: "Attached By",
        size: 200,
        cell: () => (
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
          <span className="text-gray-700 text-right block">
            {row.original?.file_size}
          </span>
        ),
      },
    ],
    [currentPage, itemsPerPage, user]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-gray-900">Attachments</h2>
            <CardActions />
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <LoadingSkeletonTable />
          ) : records?.length ? (
            <>
              <DataTable columns={columns} data={currentData} />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <p className="text-gray-500 text-center py-4">No attachments found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatedAttachmentsList;
