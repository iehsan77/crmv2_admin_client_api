"use client";

import Image from "next/image";
import { UserCheck, Calendar, Phone, Globe } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import Pagination from "@/components/Pagination2";
import RecordNotFound from "@/components/RecordNotFound";

import RecordActions from "@/partials/crm/common/RecordActions";

import {
  formatDateTime,
  getMocDataLabelByValue,
  InfoItem,
  IconItem,
  getName,
} from "@/helper/GeneralFunctions";
import {
  DEALS_TYPES_OPTIONS,
  DEALS_STAGES_OPTIONS,
  DEALS_STATUS_OPTIONS,
  DEALS_SOURCE_OPTIONS,
} from "@/constants/crm_constants";
import useDealsStore from "@/stores/crm/useDealsStore";

export default function ListCard({ records = [], useStore }) {
  const hasData = Array.isArray(records) && records.length > 0;

  const page = useStore((s) => s.page);
  const pages = useStore((s) => s.pages);
  const setPage = useStore((s) => s.setPage);

  return (
    <>
      {hasData ? (
        <div className="grid grid-cols-1 gap-4">
          {records.map((record, index) => (
            <ListCardItem key={index} record={record} />
          ))}
        </div>
      ) : (
        <RecordNotFound simple />
      )}

      {pages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={pages}
          onPageChange={setPage}
        />
      )}
    </>
  );
}

/* ✅ Single Record Card Item */
function ListCardItem({ record = {} }) {
  const owner = record?.owner_details;
  const user = record?.user_details;
  const statusLabel = getMocDataLabelByValue(
    DEALS_STATUS_OPTIONS,
    record?.status_id
  );
  const sourceLabel = getMocDataLabelByValue(
    DEALS_SOURCE_OPTIONS,
    record?.source_id
  );
  const dealTypeLabel = getMocDataLabelByValue(
    DEALS_TYPES_OPTIONS,
    record?.type_id
  );

  return (
    <Card className="w-full rounded-2xl border border-[#D4E7F7] bg-[#F5F9FF] p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-0 flex flex-col md:flex-row md:items-start justify-between gap-6">
        {/* Info Section */}

        <div className="w-full md:w-4/5_ flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center gap-3">
            {user?.image ? (
              <Image
                src={user.image}
                alt={getName(user)}
                width={48}
                height={48}
                className="rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                N/A
              </div>
            )}
            <span className="font-semibold text-base text-gray-900">
              {getName(user) || "Untitled Deal"}
            </span>
          </div>

          {/* Deal Info */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
            <InfoItem label="Deal Name" value={record?.title} />
            <InfoItem label="Amount" value={record?.amount} />
            <InfoItem label="Status" value={statusLabel} />
            <InfoItem label="Probability" value={record?.probability + "%"} />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
            <InfoItem label="Owner" value={getName(owner)} />
            <InfoItem label="Source" value={sourceLabel} />
            <InfoItem
              label="Extected Revenue"
              value={record?.expected_revenue}
            />
          </div>

          {/* Contact Info */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
            <IconItem
              icon={Calendar}
              label="Created Date"
              value={formatDateTime(record?.createdon, "MMM dd, yyyy hh:mm a")}
            />
            <IconItem
              icon={Calendar}
              label="Closing Date"
              value={formatDateTime(
                record?.closing_date,
                "MMM dd, yyyy hh:mm a"
              )}
            />
            <IconItem
              icon={UserCheck}
              label="Last Activity"
              value={formatDateTime(record?.last_activity_date)}
            />
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex items-center justify-start md:justify-end w-full md:w-1/5">
          <RecordActions
            module="deals"
            title="Deal"
            record={record}
            useStore={useDealsStore}
          />
        </div>
      </CardContent>
    </Card>
  );
}
