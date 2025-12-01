"use client";

import Image from "next/image";
import { UserCheck, CalendarDays, Timer } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import Pagination from "@/components/Pagination2";
import RecordNotFound from "@/components/RecordNotFound";

import RecordActions from "@/partials/crm/common/RecordActions";

import {
  TASKS_STATUS_OPTIONS,
  TASKS_PRIORITIES_OPTIONS,
} from "@/constants/crm_constants";

import {
  formatDateTime,
  getMocDataLabelByValue,
  InfoItem,
  IconItem,
  getName,
} from "@/helper/GeneralFunctions";
import useTasksStore from "@/stores/crm/useTasksStore";

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
  const taskFor = record?.task_for_details;
  const relatedTo = record?.related_to_details;
  const owner = record?.owner_details;

  return (
    <Card className="w-full rounded-2xl border border-[#D4E7F7] p-4 bg-white shadow-sm_ hover:shadow-md bg-[#F5F9FF] transition-all duration-200">
      <CardContent className="p-0 flex flex-col md:flex-row md:items-start justify-between gap-6">
        {/* Info Section */}
        <div className="w-full md:w-4/5_ flex flex-col gap-3 rounded-xl">
          {/* Header */}
          <div className="flex items-center gap-3">
            {taskFor?.image ? (
              <Image
                src={taskFor.image}
                alt={taskFor.first_name || `Task For ${record?.task_for}`}
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
              {getName(taskFor) || "Unknown"}
            </span>
          </div>

          {/* Task Info */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
            <InfoItem label="Subject" value={record?.subject} />
            <InfoItem
              label="Status"
              value={getMocDataLabelByValue(
                TASKS_STATUS_OPTIONS,
                record?.status_id
              )}
            />
            <InfoItem label="Reminder" value={record?.reminder} />
          </div>

          {/* Related Info */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
            <InfoItem label="Related To" value={record?.related_to} />
            <InfoItem label="Task Owner" value={getName(owner)} />
            <InfoItem
              label="Priority"
              value={getMocDataLabelByValue(
                TASKS_PRIORITIES_OPTIONS,
                record?.priority_id
              )}
            />
            <InfoItem label="Created on" value={formatDateTime(record?.createdon)} />
          </div>

          {/* Timing Info */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
            <IconItem
              icon={CalendarDays}
              label="Due Date"
              value={formatDateTime(record?.due_date, "MMM dd, yyyy hh:mm a")}
            />
            <IconItem
              icon={CalendarDays}
              label="Completion Date"
              value={formatDateTime(record?.completed_on, "MMM dd, yyyy hh:mm a")}
            />
            <IconItem
              icon={UserCheck}
              label="Last Activity"
              value={formatDateTime(record?.last_activity_date, "MMM dd, yyyy hh:mm a")}
            />
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex items-center justify-start md:justify-end w-full md:w-1/5 p-3- rounded-xl">
          <RecordActions
            module="tasks"
            title="Task"
            record={record}
            useStore={useTasksStore}
          />
        </div>
      </CardContent>
    </Card>
  );
}

