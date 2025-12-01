"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import toast from "react-hot-toast";

import { DataTable } from "@/components/DataTable2";

import ModuleHeader from "@/partials/ModuleHeader";
import WidgetSection from "@/components/WidgetSection";
import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";
import RecordNotFound from "@/components/RecordNotFound";
import Filters from "@/partials/crm/deals/Filters";
import Columns from "@/partials/crm/deals/Columns";
import ListCard from "@/partials/crm/deals/ListCard";
import Kanban from "@/partials/crm/deals/Kanban";

import ViewSwitcherAddBtn from "@/partials/crm/common/ViewSwitcherAddBtn";

import ChartsAreaChart from "@/components/ChartsAreaChart";
import ChartsPieChart from "@/components/ChartsPieChart";

import { crm_endpoints } from "@/utils/crm_endpoints";
import useCommonStore from "@/stores/useCommonStore";
import useStatisticsStore from "@/stores/useStatisticsStore";
import useDealsStore from "@/stores/crm/useDealsStore";

import { POST } from "@/helper/ServerSideActions";

export default function Page() {
  const title = "Deals";

  const { range, viewMode, setViewMode } = useCommonStore();

  const statistics = useStatisticsStore((s) => s.statistics);
  const fetchStatistics = useStatisticsStore((s) => s.fetchStatistics);
  const statisticsLoading = useStatisticsStore((s) => s.statisticsLoading);

  const page = useDealsStore((s) => s.page);
  const limit = useDealsStore((s) => s.limit);
  const records = useDealsStore((s) => s.records);
  const fetchRecords = useDealsStore((s) => s.fetchRecords);
  const recordsLoading = useDealsStore((s) => s.recordsLoading);

  const [statusLoading, setDealStatusLoading] = useState(true);
  const [statusData, setDealStatusData] = useState({});
  const [summaryChartDataLoading, setDealSummaryChartDataLoading] = useState(true);
  const [summaryChartData, setDealSummaryChartData] = useState({});

  useEffect(() => {
    fetchStatistics(crm_endpoints?.crm?.deals?.getStatistics);
  }, [fetchStatistics, range]);

  useEffect(() => {
    fetchRecords();
    setViewMode("table");
  }, [fetchRecords, setViewMode]);

  //const columns = useMemo(() => Columns(), []);
  const columns = useMemo(() => Columns({page, limit}), [page, limit]);
  const hasData = records?.length > 0;

  const contentRef = useRef(null);

  const fetchData = async (endpoint, setter, fallbackMessage) => {
    const controller = new AbortController();
    try {
      const body = {
        from: new Date(range.from).toISOString(),
        to: new Date(range.to).toISOString(),
      };
      const response = await POST(endpoint, body, { signal: controller.signal });

      console.log("response 65:", endpoint, response);

      if (response?.status === 200) {
        setter(response?.data || {});
      } else {
        toast.error(response?.message || fallbackMessage);
      }
    } catch (err) {
      if (err.name !== "AbortError") console.error(err);
    }
    return controller;
  };

  useEffect(() => {
    setDealStatusLoading(true);
    setDealSummaryChartDataLoading(true);
    const controllers = [];

    const loadData = async () => {
      controllers.push(
        await fetchData(
          crm_endpoints?.crm?.deals?.getDealsSummaryChartData,
          setDealSummaryChartData,
          "Failed to fetch deal summary data"
        ),
        await fetchData(
          crm_endpoints?.crm?.deals?.getDealsStatusChartData,
          setDealStatusData,
          "Failed to fetch deal status data"
        )
      );
      setDealStatusLoading(false);
      setDealSummaryChartDataLoading(false);
    };

    loadData();

    return () => {
      controllers.forEach((c) => c?.abort());
    };
  }, [range]);




  const SummaryChartData = {
    // 🧠 Dummy data for demonstration
    chartData: [
      { day: "Mon", allDeal: 150, dealWon: 150, dealLost: 300 },
      { day: "Tue", allDeal: 300, dealWon: 20, dealLost: 320 },
      { day: "Wed", allDeal: 40, dealWon: 300, dealLost: 340 },
      { day: "Thr", allDeal: 300, dealWon: 60, dealLost: 360 },
      { day: "Fri", allDeal: 500, dealWon: 500, dealLost: 1000 },
      { day: "Sat", allDeal: 220, dealWon: 200, dealLost: 420 },
      { day: "Sun", allDeal: 100, dealWon: 80, dealLost: 20 },
    ],

    chartConfig: {
      title: "Deals Summary - Weekly",
      titleRight: `
                <span class="inline-flex items-center gap-1 mr-3">
                  <span class="inline-block w-[10px] h-[10px] bg-[#5552faff] rounded-xs"></span>
                  All Deal
                </span>
                <span class="inline-flex items-center gap-1 mr-3">
                  <span class="inline-block w-[10px] h-[10px] bg-[#8DD3A0] rounded-xs"></span>
                  Deal-Won
                </span>
                <span class="inline-flex items-center gap-1">
                  <span class="inline-block w-[10px] h-[10px] bg-[#ED7F7A] rounded-xs"></span>
                  Deal-Lost
                </span>`,
      description: "",
      series: [
        {
          key: "allDeal",
          label: "All Deal",
          color: "#5552faff",
        },        
        { key: "dealWon", label: "Deal Won", color: "#8DD3A0" },
        { key: "dealLost", label: "Deal Lost", color: "#ED7F7A" },
      ],
      options: {
        height: 250,
        yDomain: [0, 500],
        xKey: "day",
        showGrid: true,
      },
    },
  };





  return (
    <div className="space-y-6 pb-8">
      <ModuleHeader title={title}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <WidgetSection data={statistics} loading={statisticsLoading} loadingCrdsQty={4} />
        </div>
      </ModuleHeader>

      {/* Charts */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="sm:col-span-2 py-1">
          <ChartsAreaChart
            data={summaryChartData}
            loading={summaryChartDataLoading}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-1 py-1">
          <ChartsPieChart
            title="Deal Status"
            centerLabel="Deal Status"
            data={statusData}
            loading={statusLoading}
          />
        </div>
      </div>

      <ViewSwitcherAddBtn module="deals" title="Deal" />


      <Filters />

      {recordsLoading ? (
        <LoadingSkeletonTable />
      ) : hasData ? (
        <>
          {viewMode === "table" && (
            <DataTable columns={columns} data={records} useStore={useDealsStore} />
          )}
          {viewMode === "list" && <ListCard records={records} useStore={useDealsStore} />}
          {viewMode === "grid" && <Kanban />}
        </>
      ) : (
        <RecordNotFound simple />
      )}
    </div>
  );
}
