"use client";

import Image from "next/image";
import { UserCheck, CalendarDays, Timer } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import Pagination from "@/components/Pagination2";
import RecordNotFound from "@/components/RecordNotFound";

import RecordActions from "@/partials/crm/common/RecordActions";

import {
  CALLS_STATUS_OPTIONS,
  CALLS_TYPES_OPTIONS,
} from "@/constants/crm_constants";

import {
  formatDateTime,
  getMocDataLabelByValue,
  InfoItem,
  IconItem,
  getName,
} from "@/helper/GeneralFunctions";

import useCallsStore from "@/stores/crm/useCallsStore";

export default function ListCard({ records = [], useStore }) {
  const hasData = Array.isArray(records) && records.length > 0;
  //const hasData = records.length > 0;

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
  const callFor = record?.call_for_details;
  const relatedTo = record?.related_to_details;
  const owner = record?.owner_details;

  return (
    <Card className="w-full rounded-2xl border border-[#D4E7F7] p-4 bg-white shadow-sm_ hover:shadow-md bg-[#F5F9FF] transition-all duration-200">
      <CardContent className="p-0 flex flex-col md:flex-row md:items-start justify-between gap-6">
        {/* Info Section */}
        <div className="w-full md:w-4/5_ flex flex-col gap-3 rounded-xl">
          {/* Header */}
          <div className="flex items-center gap-3">
            {owner?.image ? (
              <Image
                src={owner.image}
                alt={getName(owner)}
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
              {getName(owner) || "Unknown"}
            </span>
          </div>

          {/* Call Info */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
            <InfoItem label="Subject" value={record?.subject} />
            <InfoItem
              label="Call Type"
              value={getMocDataLabelByValue(
                CALLS_TYPES_OPTIONS,
                record?.type_id
              )}
            />
            <InfoItem
              label="Assigned Team"
              value={getName(record?.assigned_to_details)}
            />
          </div>

          {/* Related Info */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
            <InfoItem label="Related To" value={relatedTo?.title} />
            <InfoItem label="Call Owner" value={getName(owner)} />
            <InfoItem
              label="Status"
              value={getMocDataLabelByValue(
                CALLS_STATUS_OPTIONS,
                record?.status_id
              )}
            />
          </div>

          {/* Timing Info */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
            <IconItem
              icon={CalendarDays}
              label="Call Start Time"
              value={formatDateTime(record?.start_time, "MMM dd, yyyy hh:mm a")}
            />
            <IconItem
              icon={Timer}
              label="Call Duration"
              value={record?.duration}
            />
            <IconItem
              icon={UserCheck}
              label="Last Activity"
              value={record?.last_activity_date}
            />
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex items-center justify-start md:justify-end w-full md:w-1/5 p-3- rounded-xl">
          <RecordActions
            module="calls"
            title="Call"
            record={record}
            useStore={useCallsStore}
          />
        </div>
      </CardContent>
    </Card>
  );
}
