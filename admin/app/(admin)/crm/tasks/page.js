"use client";

import { useState, useEffect, useMemo } from "react";

import ModuleHeader from "@/partials/ModuleHeader";
import WidgetSection from "@/components/WidgetSection";

import { DataTable } from "@/components/DataTable2";
import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";
import RecordNotFound from "@/components/RecordNotFound";

import Filters from "@/partials/crm/tasks/Filters";
import Columns from "@/partials/crm/tasks/Columns";
import ListCard from "@/partials/crm/tasks/ListCard";
import Kanban from "@/partials/crm/tasks/Kanban";

import ViewSwitcherAddBtn from "@/partials/crm/common/ViewSwitcherAddBtn";

import { crm_endpoints } from "@/utils/crm_endpoints";

import useCommonStore from "@/stores/useCommonStore";
import useStatisticsStore from "@/stores/useStatisticsStore";
import useTasksStore from "@/stores/crm/useTasksStore";

export default function Page() {
  const title = "Tasks";

  const { range, viewMode, setViewMode } = useCommonStore();

  const statistics = useStatisticsStore((s) => s.statistics);
  const fetchStatistics = useStatisticsStore((s) => s.fetchStatistics);
  const statisticsLoading = useStatisticsStore((s) => s.statisticsLoading);

  const page = useTasksStore((s) => s.page);
  const limit = useTasksStore((s) => s.limit);
  const records = useTasksStore((s) => s.records);
  const fetchRecords = useTasksStore((s) => s.fetchRecords);
  const recordsLoading = useTasksStore((s) => s.recordsLoading);

  useEffect(() => {
    fetchStatistics(crm_endpoints?.crm?.tasks?.getStatistics);
  }, [fetchStatistics, range]);

  useEffect(() => {
    fetchRecords();
    setViewMode("table");
  }, [fetchRecords, setViewMode]);

  // ✅ UseMemo ensures columns aren't re-created every render
  //const columns = useMemo(() => Columns(), []);
  const columns = useMemo(() => Columns({ page, limit }), [page, limit]);
  const hasData = records?.length > 0;

  console.log("records 52");
  console.log(records);

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

      <ViewSwitcherAddBtn module="tasks" title="Task" />

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
                  useStore={useTasksStore}
                />
              )}
              {viewMode === "list" && (
                <ListCard records={records} useStore={useTasksStore} />
              )}
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
