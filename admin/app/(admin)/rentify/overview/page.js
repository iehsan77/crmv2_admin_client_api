"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

import Tabs from "@/components/Tabs";
import Button from "@/components/Button";
import Pagination from "@/components/Pagination";
import { DataTable } from "@/components/DataTable";
import WidgetSection from "@/components/WidgetSection";
import ChartsBarChart from "@/components/ChartsBarChart";
import ChartsPieChart from "@/components/ChartsPieChart";
import MetricsCardList from "@/components/MetricsCardList";
import RecentActivityCard from "@/components/RecentActivityCard";
import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";
import DateRangePicker from "@/components/FormFields/DateRangePicker";

import useSettingsStore from "@/stores/useSettingsStore";
import useVehiclesStore from "@/stores/rentify/useVehiclesStore";
import useOverviewStore from "@/stores/rentify/useOverviewStore";

import { POST } from "@/helper/ServerSideActions";
import { getKeyFromData } from "@/helper/GeneralFunctions";
import { rentify_endpoints } from "@/utils/rentify_endpoints";
import {
  VEHICLES_FUEL_TYPES,
  VEHICLES_SEATS,
  VEHICLES_STATUS,
  VEHICLES_TRANSMISSIONS,
} from "@/constants/rentify_constants";
import VehiclesGridCard from "@/partials/rentify/vehicles/VehiclesGridCard";
import OverviewFilters from "@/partials/rentify/overview/OverviewFilters";
import useCommonStore from "@/stores/useCommonStore";
import { useBookingsStatisticsStore } from "@/stores/rentify/useBookingsStore";

export default function Page() {
  //const currentDate = new Date();
  //const [range, setRange] = useState({ from: currentDate, to: currentDate });

  const { range, setRange } = useCommonStore();

  const [height, setHeight] = useState("auto");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    dashboard_view: null,
    key_metrics: null,
  });

  const { bookingsStatus, bookingsStatusLoading, fetchBookingsStatistics } =
    useBookingsStatisticsStore();

  const [recentActivityDataLoading, setRecentActivityDataLoading] =
    useState(null);
  const [recentActivityData, setRecentActivityData] = useState(null);

  const [
    businessOverviewChartDataLoading,
    setBusinessOverviewChartDataLoading,
  ] = useState(null);
  const [businessOverviewChartData, setBusinessOverviewChartData] =
    useState(null);

  const { viewMode } = useOverviewStore();
  const { rpp } = useSettingsStore();
  const { vehicles, vehiclesLoading, fetchVehicles, page, setPage } =
    useVehiclesStore();

  const itemsPerPage = rpp || 10;
  const contentRef = useRef(null);

  // 🔹 Reusable fetch helper
  // 🔹 Reusable fetch helper
  const fetchData = async (endpoint, params = {}, setter, fallbackMessage) => {
    const controller = new AbortController();
    try {
      const response = await POST(endpoint, params, {
        signal: controller.signal,
      });

      //console.log("response data at 81"); console.log(response);

      if (response?.status === 200) {
        setter(response?.data);
      } else {
        toast.error(response?.message || fallbackMessage);
      }
    } catch (err) {
      if (err.name !== "AbortError") console.error(err);
    }
    return controller; // ✅ return controller instead of cleanup fn
  };

  // 🔹 Fetch Overview Data

  useEffect(() => {
    fetchBookingsStatistics(range);
  }, [fetchBookingsStatistics, range]);

  useEffect(() => {
    //setBookingStatusLoading(true);
    setBusinessOverviewChartDataLoading(true);
    setStatisticsLoading(true);
    setRecentActivityDataLoading(true);
    const controllers = [];

    const loadData = async () => {
      controllers.push(
        await fetchData(
          rentify_endpoints?.rentify?.vehicles?.getOverviewStats,
          { from: range.from.toISOString(), to: range.to.toISOString() },
          setStatistics,
          "Failed to fetch overview stats data"
        ),
        await fetchData(
          rentify_endpoints?.rentify?.vehicles?.getBusinessOverviewChartData,
          {},
          setBusinessOverviewChartData,
          "Failed to fetch business overview data"
        ),
        /*
        await fetchData(
          rentify_endpoints?.rentify?.vehicles?.getBookingStatusChartData,
          {},
          setBookingStatusData,
          "Failed to fetch booking status data"
        ),
        */
        await fetchData(
          rentify_endpoints?.rentify?.vehicles?.getRecentActivity,
          {},
          setRecentActivityData,
          "Failed to fetch recent activity"
        )
      );
      //setBookingStatusLoading(false);
      setBusinessOverviewChartDataLoading(false);
      setStatisticsLoading(false);
      setRecentActivityDataLoading(false);
    };

    loadData();

    return () => {
      controllers.forEach((c) => c?.abort()); // ✅ safe cleanup
    };
  }, [range]);

  // 🔹 Fetch vehicles (recently added)
  useEffect(() => {
    fetchVehicles({ view: "recently_added" });
  }, [fetchVehicles]);

  // 🔹 Collapsible height animation
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    if (!isCollapsed) {
      const fullHeight = content.scrollHeight;
      setHeight(fullHeight);
      const timeout = setTimeout(() => setHeight("auto"), 300);
      return () => clearTimeout(timeout);
    } else {
      const fullHeight = content.scrollHeight;
      setHeight(fullHeight);
      requestAnimationFrame(() => setHeight(0));
    }
  }, [isCollapsed]);

  // 🔹 Pagination
  const totalPages = useMemo(
    () => (vehicles.length ? Math.ceil(vehicles.length / itemsPerPage) : 0),
    [vehicles.length, itemsPerPage]
  );

  const currentVehicles = useMemo(
    () => vehicles.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [vehicles, page, itemsPerPage]
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setPage(page);
  };

  // 🔹 Table Columns
  const columns = useMemo(
    () => [
      {
        id: "sno",
        header: "S.No.",
        cell: ({ row }) => (page - 1) * itemsPerPage + row.index + 1,
      },
      {
        accessorKey: "vehicle_uid",
        header: "Vehicle ID",
        cell: ({ row }) => (
          <Link href={ADMIN_PATHS?.RENTIFY?.VEHICLES?.VIEW(row.original?.id)}>
            <span className="text-[#1E3A8A]">{row.original?.vehicle_uid}</span>
          </Link>
        ),
      },
      {
        accessorKey: "title",
        header: "Vehicle Name",
        size: "400px",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Image
              src={
                row.original?.old_thumbnails?.[0]?.url || "/images/no-image.png"
              }
              alt={row.original?.title || "Vehicle"}
              width={32}
              height={32}
              className="rounded-full object-cover w-8 h-8"
            />
            <Link
              href={ADMIN_PATHS?.RENTIFY?.VEHICLES?.VIEW(row.original?.id)}
              className="text-[#1E3A8A] hover:underline text-sm font-medium truncate"
            >
              {row.original?.title}
            </Link>
          </div>
        ),
      },
      {
        accessorKey: "body_type_id",
        header: "Body Type",
        cell: ({ row }) => row.original?.body_type_details?.title || "",
      },
      {
        accessorKey: "rent_price",
        header: "Per Day Rent",
        cell: ({ row }) =>
          row.original?.rent_price
            ? `AED ${row.original?.rent_price}`
            : "AED 0",
      },

      {
        accessorKey: "status_id",
        header: "Status",
        cell: ({ row }) =>
          getKeyFromData(VEHICLES_STATUS, row?.original?.status_id),
      },

      {
        accessorKey: "transmission_type_id",
        header: "Transmission Type",
        cell: ({ row }) =>
          getKeyFromData(
            VEHICLES_TRANSMISSIONS,
            row.original?.transmission_type_id
          ),
      },
      {
        accessorKey: "seats",
        header: "Seats",
        cell: ({ row }) => getKeyFromData(VEHICLES_SEATS, row.original?.seats),
      },
      {
        accessorKey: "fuel_type_id",
        header: "Fuel Type",
        cell: ({ row }) =>
          getKeyFromData(VEHICLES_FUEL_TYPES, row.original?.fuel_type_id),
      },
      // {
      //   id: "actions",
      //   header: "Actions",
      //   cell: ({ row }) => "",
      // },
    ],
    [page, itemsPerPage]
  );

  // 🔹 Tabs
  const navTabs = [
    {
      name: "Dashboard View",
      value: "dashboard",
      content: (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <WidgetSection
            data={statistics.dashboard_view}
            loading={statisticsLoading}
          />
        </div>
      ),
    },
    {
      name: "Key Metrics",
      value: "metrics",
      content: <MetricsCardList data={statistics.key_metrics} />,
    },
  ];

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-semibold text-gray-900">Overview</h1>
        <div className="flex items-center justify-between gap-4">
          <div className="max-w-md space-y-4">
            {/* <DateRangePicker
              value={range}
              onChange={setRange}
              minDate={new Date(2023, 0, 1)}
              maxDate={new Date()}
              allowClear={false}
              defaultValue={range}
            /> */}
            {setRange && (
              <DateRangePicker
                value={range}
                onChange={setRange}
                minDate={new Date(2023, 0, 1)}
                //maxDate={new Date()}
                allowClear={false}
              />
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="border-0 shadow-none hover:bg-transparent flex items-center gap-2"
          >
            {isCollapsed ? "Expand" : "Collapse"}
            <div className="p-1 border rounded-full shadow-md transition-transform duration-300">
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform duration-300",
                  isCollapsed && "-rotate-90"
                )}
              />
            </div>
          </Button>
        </div>
      </div>

      {/* Collapsible Section */}
      <div
        ref={contentRef}
        style={{
          maxHeight: height === "auto" ? "none" : `${height}px`,
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}
        className="space-y-4"
      >
        <Tabs tabs={navTabs} />

        {/* Charts */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2 py-1">
            <ChartsBarChart
              data={businessOverviewChartData}
              loading={businessOverviewChartDataLoading}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1 py-1">
            {/* <ChartsPieChart
              title="Booking Status"
              centerLabel="Booking Status"
              data={bookingStatusData}
              loading={bookingStatusLoading}
            /> */}
            <ChartsPieChart
              title="Booking Status"
              centerLabel="Booking Status"
              data={bookingsStatus}
              loading={bookingsStatusLoading}
            />
          </div>
        </div>
      </div>

      {/* Table / Grid View */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <OverviewFilters />

          <div className="space-y-4">
            {vehiclesLoading ? (
              <LoadingSkeletonTable />
            ) : viewMode === "table" ? (
              <DataTable columns={columns} data={currentVehicles} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {currentVehicles?.length > 0 ? (
                  currentVehicles.map((vehicle, index) => (
                    <VehiclesGridCard key={index} vehicle={vehicle} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-6 text-gray-500">
                    No vehicles found
                  </div>
                )}
              </div>
            )}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>

        <div className="col-span-1">
          <RecentActivityCard
            data={recentActivityData}
            loading={recentActivityDataLoading}
          />
        </div>
      </div>
    </div>
  );
}
