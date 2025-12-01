"use client";

import { useState, useEffect, useMemo } from "react";

import ModuleHeader from "@/partials/ModuleHeader";
import WidgetSection from "@/components/WidgetSection";

import { DataTable } from "@/components/DataTable2";
import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";
import RecordNotFound from "@/components/RecordNotFound";

import Filters from "@/partials/crm/meetings/Filters";
import Columns from "@/partials/crm/meetings/Columns";
import ListCard from "@/partials/crm/meetings/ListCard";
import Kanban from "@/partials/crm/meetings/Kanban";

import ViewSwitcherAddBtn from "@/partials/crm/common/ViewSwitcherAddBtn";

import { crm_endpoints } from "@/utils/crm_endpoints";

import useCommonStore from "@/stores/useCommonStore";
import useStatisticsStore from "@/stores/useStatisticsStore";
import useMeetingsStore from "@/stores/crm/useMeetingsStore";

export default function Page() {
  const title = "Meetings";

  const { range, viewMode, setViewMode } = useCommonStore();

  const statistics = useStatisticsStore((s) => s.statistics);
  const fetchStatistics = useStatisticsStore((s) => s.fetchStatistics);
  const statisticsLoading = useStatisticsStore((s) => s.statisticsLoading);

  const page = useMeetingsStore((s) => s.page);
  const limit = useMeetingsStore((s) => s.limit);
  const records = useMeetingsStore((s) => s.records);
  const fetchRecords = useMeetingsStore((s) => s.fetchRecords);
  const recordsLoading = useMeetingsStore((s) => s.recordsLoading);

  useEffect(() => {
    fetchStatistics(crm_endpoints?.crm?.meetings?.getStatistics);
  }, [fetchStatistics, range]);

  useEffect(() => {
    fetchRecords();
    setViewMode("table");
  }, [fetchRecords, setViewMode]);

  // ✅ UseMemo ensures columns aren't re-created every render
  //const columns = useMemo(() => Columns(), []);
const columns = useMemo(() => Columns({page, limit}), [page, limit]);
  const hasData = records?.length > 0;


console.log("records 52")
console.log(records)

  return (
    <div className="space-y-6 pb-8">
      <ModuleHeader title={title}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <WidgetSection
            data={statistics}
            loading={statisticsLoading}
            loadingCrdsQty={4}
          />
        </div>
      </ModuleHeader>

      <ViewSwitcherAddBtn module="meetings" title="Meeting" />

      <Filters />

      {recordsLoading ? (
        <LoadingSkeletonTable />
      ) : (
        <>
          {hasData ? (
            <>
              {viewMode === "table" && (
                <DataTable
                  columns={columns}
                  data={records}
                  useStore={useMeetingsStore}
                />
              )}
              {viewMode === "list" && <ListCard records={records} useStore={useMeetingsStore} />}
              {viewMode === "grid" && <Kanban />}
            </>
          ) : (
            <RecordNotFound simple />
          )}
        </>
      )}
    </div>
  );
}
