"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import toast from "react-hot-toast";

import { DataTable } from "@/components/DataTable2";

import ModuleHeader from "@/partials/ModuleHeader";
import WidgetSection from "@/components/WidgetSection";
import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";
import RecordNotFound from "@/components/RecordNotFound";
import Filters from "@/partials/crm/contacts/Filters";
import Columns from "@/partials/crm/contacts/Columns";
import ListCard from "@/partials/crm/contacts/ListCard";
import Kanban from "@/partials/crm/contacts/Kanban";

import ViewSwitcherAddBtn from "@/partials/crm/common/ViewSwitcherAddBtn";

import ChartsAreaChart from "@/components/ChartsAreaChart";
import ChartsPieChart from "@/components/ChartsPieChart";

import { crm_endpoints } from "@/utils/crm_endpoints";
import useCommonStore from "@/stores/useCommonStore";
import useStatisticsStore from "@/stores/useStatisticsStore";
import useContactsStore from "@/stores/crm/useContactsStore";

import { POST } from "@/helper/ServerSideActions";

export default function Page() {
  const title = "Contacts";

  const { range, viewMode, setViewMode } = useCommonStore();

  const statistics = useStatisticsStore((s) => s.statistics);
  const fetchStatistics = useStatisticsStore((s) => s.fetchStatistics);
  const statisticsLoading = useStatisticsStore((s) => s.statisticsLoading);

  const page = useContactsStore((s) => s.page);
  const limit = useContactsStore((s) => s.limit);
  const records = useContactsStore((s) => s.records);
  const fetchRecords = useContactsStore((s) => s.fetchRecords);
  const recordsLoading = useContactsStore((s) => s.recordsLoading);

  const [statusLoading, setContactStatusLoading] = useState(true);
  const [statusData, setContactStatusData] = useState({});
  const [summaryChartDataLoading, setContactSummaryChartDataLoading] =
    useState(true);
  const [summaryChartData, setContactSummaryChartData] = useState({});

  useEffect(() => {
    fetchStatistics(crm_endpoints?.crm?.contacts?.getStatistics);
  }, [fetchStatistics, range]);

  useEffect(() => {
    fetchRecords();
    setViewMode("table");
  }, [fetchRecords, setViewMode]);

  //const columns = useMemo(() => Columns(), []);
  const columns = useMemo(() => Columns({ page, limit }), [page, limit]);
  const hasData = records?.length > 0;

  const contentRef = useRef(null);

  const fetchData = async (endpoint, setter, fallbackMessage) => {
    const controller = new AbortController();
    try {
      const body = {
        from: new Date(range.from).toISOString(),
        to: new Date(range.to).toISOString(),
      };

      const response = await POST(endpoint, body, {
        signal: controller.signal,
      });

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
    setContactStatusLoading(true);
    setContactSummaryChartDataLoading(true);
    const controllers = [];

    const loadData = async () => {
      controllers.push(
        await fetchData(
          crm_endpoints?.crm?.contacts?.getSummaryChartData,
          setContactSummaryChartData,
          "Failed to fetch contact summary data"
        ),
        await fetchData(
          crm_endpoints?.crm?.contacts?.getStatusChartData,
          setContactStatusData,
          "Failed to fetch contact status data"
        )
      );
      setContactStatusLoading(false);
      setContactSummaryChartDataLoading(false);
    };

    loadData();

    return () => {
      controllers.forEach((c) => c?.abort());
    };
  }, [range]);

  console.log("records 111");
  console.log(records);





  const SummaryChartData = {
    // 🧠 Dummy data for demonstration
    chartData: [
      { day: "Mon", newContacts: 150, closedWon: 150, closedLost: 300 },
      { day: "Tue", newContacts: 300, closedWon: 20, closedLost: 320 },
      { day: "Wed", newContacts: 40, closedWon: 300, closedLost: 340 },
      { day: "Thr", newContacts: 300, closedWon: 60, closedLost: 360 },
      { day: "Fri", newContacts: 500, closedWon: 500, closedLost: 1000 },
      { day: "Sat", newContacts: 220, closedWon: 200, closedLost: 420 },
      { day: "Sun", newContacts: 100, closedWon: 80, closedLost: 20 },
    ],

    chartConfig: {
      title: "Contacts Summary - Weekly",
      titleRight: `
                <span class="inline-flex items-center gap-1 mr-3">
                  <span class="inline-block w-[10px] h-[10px] bg-[#6586E6] rounded-xs"></span>
                  New Contacts
                </span>
                <span class="inline-flex items-center gap-1 mr-3">
                  <span class="inline-block w-[10px] h-[10px] bg-[#8DD3A0] rounded-xs"></span>
                  Closed-Won
                </span>
                <span class="inline-flex items-center gap-1">
                  <span class="inline-block w-[10px] h-[10px] bg-[#ED7F7A] rounded-xs"></span>
                  Closed-Lost
                </span>`,
      description: "",
      series: [
        { key: "closedLost", label: "New Contacts", color: "#6586E6" },
        {
          key: "newContacts",
          label: "Closed-Won",
          color: "#8DD3A0",
        },
        { key: "closedWon", label: "Closed-Lost", color: "#ED7F7A" },
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
          <WidgetSection
            data={statistics}
            loading={statisticsLoading}
            loadingCrdsQty={4}
          />
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
            title="Contact Status"
            centerLabel="Contact Status"
            data={statusData}
            loading={statusLoading}
          />
        </div>
      </div>

      <ViewSwitcherAddBtn module="contacts" title="Contact" />

      <Filters />

      {recordsLoading ? (
        <LoadingSkeletonTable />
      ) : hasData ? (
        <>
          {viewMode === "table" && (
            <DataTable
              columns={columns}
              data={records}
              useStore={useContactsStore}
            />
          )}
          {viewMode === "list" && (
            <ListCard records={records} useStore={useContactsStore} />
          )}
          {viewMode === "grid" && <Kanban />}
        </>
      ) : (
        <RecordNotFound simple />
      )}
    </div>
  );
}
