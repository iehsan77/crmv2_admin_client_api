"use client";

import Image from "next/image";
import { UserCheck, Mail, Phone, Globe, Calendar1 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import Pagination from "@/components/Pagination2";
import RecordNotFound from "@/components/RecordNotFound";

import RecordActions from "@/partials/crm/common/RecordActions";

import {
  formatDateTime,
  getMocDataLabelByValue,
  getName,
  InfoItem,
  IconItem,
} from "@/helper/GeneralFunctions";
import { ACCOUNTS_STATUS_OPTIONS, ACCOUNTS_TYPES } from "@/constants/crm_constants";
import { INDUSTRIES } from "@/constants/general_constants";

import useAccountsStore from "@/stores/crm/useAccountsStore";

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
  const user = record?.user_details;
  const owner = record?.owner_details;
  const industryLabel = getMocDataLabelByValue(INDUSTRIES, record?.industry_id);
  const accountTypeLabel = getMocDataLabelByValue(
    ACCOUNTS_TYPES,
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
                alt={user?.name || getName(user)}
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
              {user?.name || getName(user)}
            </span>
          </div>

          {/* Account Info */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
            <InfoItem label="Industry" value={industryLabel} />
            <InfoItem label="Employees" value={record?.employees} />
            <InfoItem label="Annual Revenue" value={record?.annual_revenue} />
            <InfoItem label="Employees" value={record?.employees} />
            <InfoItem label="Account Owner" value={getName(owner)} />
            <InfoItem
              label="Account Type"
              value={getMocDataLabelByValue(
                ACCOUNTS_TYPES,
                record?.type_id
              )}
            />
            <InfoItem
              label="Status"
              value={getMocDataLabelByValue(
                ACCOUNTS_STATUS_OPTIONS,
                record?.status_id
              )}
            />
            {/* <InfoItem label="Account Type" value={accountTypeLabel} /> */}
          </div>

          {/* Contact Info */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
            <IconItem icon={Mail} label="Email" value={record?.email} />
            <IconItem icon={Phone} label="Phone" value={record?.phone} />
            <IconItem icon={Globe} label="Website" value={record?.website} />
            <IconItem
              icon={UserCheck}
              label="Last Activity"
              value={formatDateTime(record?.last_activity_date)}
            />
            <IconItem
              icon={Calendar1}
              label="Created on Date"
              value={formatDateTime(record?.createdon)}
            />
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex items-center justify-start md:justify-end w-full md:w-1/5">
          <RecordActions
            module="accounts"
            title="Account"
            record={record}
            useStore={useAccountsStore}
          />
        </div>
      </CardContent>
    </Card>
  );
}
