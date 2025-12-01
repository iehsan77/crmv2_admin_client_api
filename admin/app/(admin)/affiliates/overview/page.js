"use client";

import { useEffect, useState, useRef } from "react";

import Link from "next/link";
import Image from "next/image";

import { ChevronDown, Eye, Pen, Star } from "lucide-react";

import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import Tabs from "@/components/Tabs";
import Pagination from "@/components/Pagination";
import { DataTable } from "@/components/DataTable";
import MetricsCardList from "@/components/MetricsCardList";
import SegmentedToggle from "@/components/FormFields/SegmentedToggle";

import { useDrawer } from "@/context/drawer-context";

import WidgetSection from "@/components/WidgetSection";

import AffiliatesFilters from "@/partials/affiliates/AffiliatesFilters";
import AffiliatesForm from "@/partials/affiliates/AffiliatesForm";

import { POST, GET } from "@/helper/ServerSideActions";
import { rentify_endpoints } from "@/utils/rentify_endpoints";

import useSettingsStore from "@/stores/useSettingsStore";
import useAffiliatesStore from "@/stores/rentify/affiliates/useAffiliatesStore";

import DateRangePicker from "@/components/FormFields/DateRangePicker";

import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useCommonStore from "@/stores/useCommonStore";
import { DocItem } from "@/helper/GeneralFunctions";
import DocsSection from "@/partials/affiliates/DocsSection";

export default function Page() {
  //const currentDate = new Date();
  //const [range, setRange] = useState({ from: currentDate, to: currentDate });

  const { range, setRange } = useCommonStore();

  const [record, setRecord] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [height, setHeight] = useState("auto");
  const contentRef = useRef(null);

  const [loading, setLoading] = useState(true);

  const rpp = useSettingsStore((state) => state.rpp);

  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    dashboard_view: null,
    key_metrics: null,
  });

  const itemsPerPage = rpp;

  const {
    affiliates,
    setAffiliates,
    getAffiliate,
    updateAffiliate,
    fetchAffiliates,
    affiliatesLoading,
    page,
    setPage,
  } = useAffiliatesStore();
  const { showDrawer } = useDrawer();

  // 🔹 Reusable fetch helper (no cleanup return)
  const fetchData = async (
    endpoint,
    params = {},
    setter,
    fallbackMessage,
    signal
  ) => {
    try {
      const response = await POST(endpoint, params, { signal });
      if (response?.status === 200) {
        setter(response?.data);
      } else {
        toast.error(response?.message || fallbackMessage);
      }
    } catch (err) {
      if (err.name !== "AbortError") console.error(err);
    }
  };

  // 🔹 Fetch Overview Data
  useEffect(() => {
    setStatisticsLoading(true);

    const controller = new AbortController();

    fetchData(
      rentify_endpoints?.rentify?.affiliates?.getStatistics,
      { from: range.from.toISOString(), to: range.to.toISOString() },
      setStatistics,
      "Failed to fetch overview stats data",
      controller.signal
    ).finally(() => {
      setStatisticsLoading(false);
    });

    // ✅ Proper cleanup
    return () => controller.abort();
  }, [range]);

  useEffect(() => {
    fetchAffiliates({ view: "all_affiliates" });
    setLoading(false);
  }, [fetchAffiliates]);

  const totalPages = affiliates.length
    ? Math.ceil(affiliates.length / itemsPerPage)
    : 1;
  const currentAffiliates = affiliates.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setPage(page);
  };

  // Collapse/Expand height calc
  useEffect(() => {
    if (!contentRef.current) return;

    if (!isCollapsed) {
      const fullHeight = contentRef.current.scrollHeight;
      setHeight(fullHeight);

      const timeout = setTimeout(() => setHeight("auto"), 300);
      return () => clearTimeout(timeout);
    } else {
      const fullHeight = contentRef.current.scrollHeight;
      setHeight(fullHeight);
      requestAnimationFrame(() => setHeight(0));
    }
  }, [isCollapsed]);

  const markAsFavorite = async (id, v) => {
    try {
      const newFav = v === 1 ? 0 : 1;
      const response = await GET(
        rentify_endpoints?.rentify?.affiliates?.favorite(id, newFav)
      );
      if (response?.status === 200) {
        const updatedAffiliates = affiliates.map((a) =>
          a.id === id ? { ...a, favorite: newFav } : a
        );
        setAffiliates(updatedAffiliates);
        toast.success(`Updated favorite status.`);
      } else {
        toast.error("Failed to update favorite status.");
      }
    } catch (err) {
      toast.error("Failed to update favorite.");
    }
  };

  // --- Columns ---
  const columns = [
    {
      accessorKey: "serial",
      header: () => <div className="text-center">Sr. No.</div>,
      cell: ({ row }) => {
        const serial = (page - 1) * itemsPerPage + (row.index + 1);
        return <span className="block text-center">{serial}</span>;
      },
    },
    {
      accessorKey: "id",
      header: () => <div className="text-center">Affiliate ID</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <Link
            href={ADMIN_PATHS?.RENTIFY?.AFFILIATES?.VIEW(row?.original?.id)}
            className="text-[#1E3A8A] hover:underline"
          >
            {row?.original?.id}
          </Link>
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      size: 300,
      cell: ({ row }) => (
        <span>
          {row.original?.first_name} {row.original?.last_name}
        </span>
      ),
    },
    {
      header: "Bookings",
      accessorKey: "bookings_count",
    },
    {
      header: "Company",
      accessorKey: "is_company",
      cell: ({ row }) => (
        <span>
          {row.original?.is_company > 0 ? row.original?.company_name : "-"}
        </span>
      ),
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    {
      accessorKey: "active",
      header: () => <div className="text-center">Active</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <SegmentedToggle
            value={row.original.active}
            onChange={(newValue) =>
              handleStatusChange(row.original.id, newValue)
            }
            options={[
              { label: "Off", value: 0 },
              { label: "On", value: 1 },
            ]}
          />
        </div>
      ),
    },
    {
      accessorKey: "documents",
      header: "Documents",
      cell: ({ row }) => (
        <>
          <div className="flex flex-col text-sm">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">View</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>CLICK TO VIEW DOCUMENTS</DropdownMenuLabel>
                {row.original?.is_company ? (
                  <DocsSection type="company" record={row.original} />
                ) : (
                  <DocsSection type="individual" record={row.original} />
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      ),
    },
    {
      accessorKey: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-center items-center gap-2">
          {/* ⭐ Favorite */}
          <Button
            variant="outline"
            size="icon"
            title="Favorite"
            onClick={() =>
              markAsFavorite(row.original?.id, row.original?.favorite)
            }
          >
            <Star
              className={`h-4 w-4 ${
                row.original?.favorite === 1
                  ? "text-yellow-400"
                  : "text-gray-400"
              }`}
              fill={row.original?.favorite === 1 ? "currentColor" : "none"}
            />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              showDrawer({
                title: "Edit Affiliate",
                size: "xl",
                content: <AffiliatesForm record={row.original} />,
              })
            }
          >
            <Pen className="h-4 w-4" />
          </Button>

          <Link href={ADMIN_PATHS?.RENTIFY?.AFFILIATES?.VIEW(row.original.id)}>
            <Button variant="outline" size="icon">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  // 🔹 Tabs
  const navTabs = [
    {
      name: "Dashboard View",
      value: "dashboard",
      content: (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <WidgetSection
            data={statistics.dashboard_view}
            //data={[]}
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

  const handleStatusChange = async (id, value) => {
    try {
      const body = {
        id: id,
        active: value,
      };

      const response = await POST(
        rentify_endpoints?.rentify?.affiliates?.changeActiveStatus,
        body
      );
      if (response?.status === 200) {
        const affiliateData = getAffiliate(id);
        if (affiliateData) {
          affiliateData["active"] = value;
          updateAffiliate(affiliateData);
        }
        toast.success(response?.message);
      } else {
        toast.error(response?.message);
      }
    } catch (error) {
      console.error("Status change failed:", error);
      toast.error("Failed to update affiliate status");
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-semibold text-gray-900">
          Affiliate Overview
        </h1>
        <div className="flex items-center gap-4">
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

      {/* Collapsible Widgets */}
      <div
        ref={contentRef}
        style={{
          maxHeight: height === "auto" ? "none" : `${height}px`,
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}
      >
        <Tabs tabs={navTabs} />
      </div>

      {/* Add Affiliate Button */}
      <div className="flex items-center justify-end">
        <Button
          onClick={() =>
            showDrawer({
              title: "Add Affiliate",
              size: "xl",
              content: <AffiliatesForm record={record} />,
            })
          }
        >
          Add Affiliate
        </Button>
      </div>

      {/* Filters */}
      <AffiliatesFilters />

      {/* Table */}
      {affiliatesLoading ? (
        <LoadingSkeletonTable />
      ) : (
        <DataTable columns={columns} data={currentAffiliates} />
      )}
      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
