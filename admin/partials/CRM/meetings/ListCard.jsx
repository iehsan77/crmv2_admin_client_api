"use client";

import Image from "next/image";
import { UserCheck, CalendarDays, Timer } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import Pagination from "@/components/Pagination2";
import RecordNotFound from "@/components/RecordNotFound";

import RecordActions from "@/partials/crm/common/RecordActions";

import { MEETINGS_STATUS_OPTIONS } from "@/constants/crm_constants";

import {
  formatDateTime,
  getMocDataLabelByValue,
  InfoItem,
  IconItem,
  getName,
} from "@/helper/GeneralFunctions";
import useMeetingsStore from "@/stores/crm/useMeetingsStore";

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
  const meetingFor = record?.meeting_for_details;
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

          {/* Meeting Info */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
            <InfoItem label="Title" value={record?.title} />
            <InfoItem
              label="Status"
              value={getMocDataLabelByValue(
                MEETINGS_STATUS_OPTIONS,
                record?.status_id
              )}
            />
            <InfoItem label="Venue" value={record?.venue} />
            <InfoItem label="Location" value={record?.location} />
          </div>

          {/* Related Info */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
            <InfoItem label="Related To" value={record?.related_to} />
            <InfoItem label="Meeting Owner" value={getName(owner)} />
          </div>

          {/* Timing Info */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
            <IconItem
              icon={CalendarDays}
              label="Meeting Start Time"
              value={formatDateTime(record?.start_time, "MMM dd, yyyy hh:mm a")}
            />
            <IconItem
              icon={CalendarDays}
              label="Meeting End Time"
              value={formatDateTime(record?.end_time, "MMM dd, yyyy hh:mm a")}
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
            module="meetings"
            title="Meeting"
            record={record}
            useStore={useMeetingsStore}
          />
        </div>
      </CardContent>
    </Card>
  );
}
