"use client";

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";

import { DataTable } from "@/components/DataTable2";
import ModuleHeader from "@/partials/ModuleHeader";
import WidgetSection from "@/components/WidgetSection";
import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";
import RecordNotFound from "@/components/RecordNotFound";
import Filters from "@/partials/crm/leads/Filters";
import Columns from "@/partials/crm/leads/Columns";
import ListCard from "@/partials/crm/leads/ListCard";
import Kanban from "@/partials/crm/leads/Kanban";

import ViewSwitcherAddBtn from "@/partials/crm/common/ViewSwitcherAddBtn";

import ChartsPieChart from "@/components/ChartsPieChart";
import ChartsAreaChart from "@/components/ChartsAreaChart";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST } from "@/helper/ServerSideActions";

import useCommonStore from "@/stores/useCommonStore";
import useLeadsStore from "@/stores/crm/useLeadsStore";
import useStatisticsStore from "@/stores/useStatisticsStore";

export default function LeadsPage() {
  const title = "Leads";

  /** ---------- STORE HOOKS ---------- **/
  const { range, viewMode, setViewMode } = useCommonStore();
  const { statistics, fetchStatistics, statisticsLoading } =
    useStatisticsStore();
  const { records, fetchRecords, recordsLoading, page, limit } =
    useLeadsStore();

  /** ---------- LOCAL STATE ---------- **/
  const [summaryChartData, setSummaryChartData] = useState({});
  const [statusChartData, setStatusChartData] = useState({});
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);

  /** ---------- DATA FETCH HELPERS ---------- **/
  const fetchData = async (endpoint, setter, errorMsg) => {
    const controller = new AbortController();
    try {
      const body = {
        from: new Date(range.from).toISOString(),
        to: new Date(range.to).toISOString(),
      };

      const response = await POST(endpoint, body, {
        signal: controller.signal,
      });

      console.log("response statistics 48");
      console.log(response);

      if (response?.status === 200) setter(response?.data ?? {});
      else toast.error(response?.message || errorMsg);
    } catch (err) {
      if (err.name !== "AbortError") console.error("Fetch error:", err);
    }
    return controller;
  };

  /** ---------- EFFECTS ---------- **/

  // Fetch statistics when range changes
  useEffect(() => {
    fetchStatistics(crm_endpoints.crm.leads.getStatistics);
  }, [fetchStatistics, range]);

  // Fetch records and reset view mode on mount
  useEffect(() => {
    fetchRecords();
    setViewMode("table");
  }, [fetchRecords, setViewMode]);

  // Fetch charts data
  useEffect(() => {
    setSummaryLoading(true);
    setStatusLoading(true);

    const controllers = [];

    (async () => {
      const summaryCtrl = await fetchData(
        crm_endpoints.crm.leads.getSummaryChartData,
        setSummaryChartData,
        "Failed to fetch lead summary data"
      );

      const statusCtrl = await fetchData(
        crm_endpoints.crm.leads.getStatusChartData,
        setStatusChartData,
        "Failed to fetch lead status data"
      );

      controllers.push(summaryCtrl, statusCtrl);
      setSummaryLoading(false);
      setStatusLoading(false);
    })();

    return () => controllers.forEach((c) => c?.abort());
  }, [range]);

  /** ---------- MEMOS ---------- **/
  const columns = useMemo(() => Columns({ page, limit }), [page, limit]);
  const hasData = records?.length > 0;

  const SummaryChartData = {
    // 🧠 Dummy data for demonstration
    chartData: [
      { day: "Mon", convertedLeads: 150, lostLeads: 150, allLeads: 300 },
      { day: "Tue", convertedLeads: 300, lostLeads: 20, allLeads: 320 },
      { day: "Wed", convertedLeads: 40, lostLeads: 300, allLeads: 340 },
      { day: "Thr", convertedLeads: 300, lostLeads: 60, allLeads: 360 },
      { day: "Fri", convertedLeads: 500, lostLeads: 500, allLeads: 1000 },
      { day: "Sat", convertedLeads: 220, lostLeads: 200, allLeads: 420 },
      { day: "Sun", convertedLeads: 100, lostLeads: 80, allLeads: 20 },
    ],

    chartConfig: {
      title: "Leads Summary - Weekly",
      titleRight: `
                <span class="inline-flex items-center gap-1 mr-3">
                  <span class="inline-block w-[10px] h-[10px] bg-[#6586E6] rounded-xs"></span>
                  All Leads
                </span>
                <span class="inline-flex items-center gap-1 mr-3">
                  <span class="inline-block w-[10px] h-[10px] bg-[#8DD3A0] rounded-xs"></span>
                  Converted Leads
                </span>
                <span class="inline-flex items-center gap-1">
                  <span class="inline-block w-[10px] h-[10px] bg-[#ED7F7A] rounded-xs"></span>
                  Lost Leads
                </span>`,
      description: "",
      series: [
        { key: "allLeads", label: "All Leads", color: "#6586E6" },
        {
          key: "convertedLeads",
          label: "Converted Leads",
          color: "#8DD3A0",
        },
        { key: "lostLeads", label: "Lost Leads", color: "#ED7F7A" },
      ],
      options: {
        height: 250,
        yDomain: [0, 500],
        xKey: "day",
        showGrid: true,
      },
    },
  };

  /** ---------- RENDER ---------- **/
  return (
    <div className="space-y-6 pb-8">
      {/* HEADER */}
      <ModuleHeader title={title}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <WidgetSection
            data={statistics}
            loading={statisticsLoading}
            loadingCrdsQty={4}
          />
        </div>
      </ModuleHeader>

      {/* CHARTS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="sm:col-span-2 py-1">
          <ChartsAreaChart data={summaryChartData} loading={summaryLoading} />
        </div>
        <div className="sm:col-span-2 lg:col-span-1 py-1">
          <ChartsPieChart
            title="Lead Status"
            centerLabel="Lead Status"
            data={statusChartData}
            loading={statusLoading}
          />
        </div>
      </div>

      {/* ACTIONS + FILTERS */}
      <ViewSwitcherAddBtn module="leads" title="Lead" />

      <Filters />

      {/* TABLE / LIST / KANBAN */}
      {recordsLoading ? (
        <LoadingSkeletonTable />
      ) : hasData ? (
        <>
          {viewMode === "table" && (
            <DataTable
              columns={columns}
              data={records}
              useStore={useLeadsStore}
            />
          )}
          {viewMode === "list" && (
            <ListCard records={records} useStore={useLeadsStore} />
          )}
          {viewMode === "grid" && <Kanban />}
        </>
      ) : (
        <RecordNotFound simple />
      )}
    </div>
  );
}
