"use client";
import { useRef, useState, useEffect } from "react";

import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

import Button from "@/components/Button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LayoutGrid, LayoutList, Table } from "lucide-react";

import { cn } from "@/lib/utils";

import WidgetSection from "@/components/WidgetSection";
import DateRangePicker from "@/components/FormFields/DateRangePicker";

import VehiclesFilters from "@/partials/rentify/vehicles/VehiclesFilters";
import VehiclesListCard from "@/partials/rentify/vehicles/VehiclesListCard";
import VehiclesGridCard from "@/partials/rentify/vehicles/VehiclesGridCard";
import VehiclesForm from "@/partials/rentify/vehicles/VehiclesForm";
import VehiclesActionButtons from "@/partials/rentify/vehicles/VehiclesActionButtons";

import { useDrawer } from "@/context/drawer-context";

import ChartsPieChart from "@/components/ChartsPieChart";
import RecordNotFound from "@/components/RecordNotFound";

import { DataTable } from "@/components/DataTable";
import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";
import Pagination from "@/components/Pagination";

import useCommonStore from "@/stores/useCommonStore";
import useVehiclesStore from "@/stores/rentify/useVehiclesStore";

import { getKeyFromData } from "@/helper/GeneralFunctions";

import { POST } from "@/helper/ServerSideActions";
import { rentify_endpoints } from "@/utils/rentify_endpoints";

import {
  VEHICLES_FUEL_TYPES,
  VEHICLES_SEATS,
  VEHICLES_STATUS,
  VEHICLES_TRANSMISSIONS,
} from "@/constants/rentify_constants";
import { Badge } from "@/components/ui/badge";

export default function Page() {
  const [selectedRange, setSelectedRange] = useState("week");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [height, setHeight] = useState("auto");
  const [viewMode, setViewMode] = useState("list");

  const [statistics, setStatistics] = useState(null);
  const [statisticsLoading, setStatisticsLoading] = useState(true);

  const [vehicleStatusLoading, setVehicleStatusLoading] = useState(true);
  const [vehicleStatus, setVehicleStatus] = useState(null);

  const itemsPerPage = 5;

  const { showDrawer } = useDrawer();
  const { range, setRange } = useCommonStore();

  //const { vehicles, vehiclesLoading, fetchVehicles } = useVehiclesStore();
  const {
    vehicles,
    vehiclesLoading,
    setVehicles,
    fetchVehicles,
    page,
    setPage,
  } = useVehiclesStore();

  const viewOptions = [
    { value: "list", label: "List", icon: LayoutList },
    { value: "table", label: "Table", icon: Table },
    { value: "grid", label: "Grid", icon: LayoutGrid },
  ];

  const selectedView = viewOptions.find((v) => v.value === viewMode);
  const contentRef = useRef(null);

  const rangeOptions = [
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
  ];

  const selectedLabel =
    rangeOptions.find((opt) => opt.value === selectedRange)?.label || "Week";

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
    setVehicleStatusLoading(true);

    const controller1 = new AbortController();
    const controller2 = new AbortController();

    fetchData(
      rentify_endpoints?.rentify?.vehicles?.getStatistics,
      { from: range.from.toISOString(), to: range.to.toISOString() },
      setStatistics,
      "Failed to fetch overview stats data",
      controller1.signal
    );

    fetchData(
      rentify_endpoints?.rentify?.vehicles?.getVehiclesStatus,
      { from: range.from.toISOString(), to: range.to.toISOString() },
      setVehicleStatus,
      "Failed to fetch business overview data",
      controller2.signal
    );

    setStatisticsLoading(false);
    setVehicleStatusLoading(false);

    // ✅ Cleanup both requests properly
    return () => {
      controller1.abort();
      controller2.abort();
    };
  }, [range]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    if (!isCollapsed) {
      const fullHeight = content.scrollHeight;
      setHeight(fullHeight);

      const timeout = setTimeout(() => {
        setHeight("auto");
      }, 300);

      return () => clearTimeout(timeout);
    } else {
      const fullHeight = content.scrollHeight;
      setHeight(fullHeight);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setHeight(0);
        });
      });
    }
  }, [isCollapsed]);

  const totalPages = Math.max(1, Math.ceil(vehicles?.length / itemsPerPage));
  const currentVehicles = vehicles?.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setPage(page);
    }
  };

  const columns = ({ page = 1, itemsPerPage = 10 }) => [
    {
      id: "sno",
      header: "S.No.",
      cell: ({ row }) => (page - 1) * itemsPerPage + row.index + 1,
    },

    {
      accessorKey: "vehicle_uid",
      header: "Vehicle ID",
      cell: ({ row }) => (
        <Link href={ADMIN_PATHS?.RENTIFY?.VEHICLES?.VIEW(row?.original?.id)}>
          <span className="text-[#1E3A8A] hover:underline cursor-pointer">
            {row?.original?.vehicle_uid}
          </span>
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
              row?.original?.old_thumbnails?.length > 0
                ? row?.original?.old_thumbnails[0]?.url
                : "/images/no-image.png"
            }
            alt={row?.original?.title}
            width={32}
            height={32}
            className="rounded-full object-cover w-8 h-8"
          />

          <div>
            <Link
              href={ADMIN_PATHS?.RENTIFY?.VEHICLES?.VIEW(row?.original?.id)}
              className="text-[#1E3A8A] hover:underline text-sm font-medium"
            >
              {row?.original?.title}
            </Link>

            {Number(row?.original?.affiliate_id) > 0 && (
              <div className="text-sm text-muted-foreground">
                Affiliation:{" "}
                <Link
                  href={ADMIN_PATHS?.RENTIFY?.AFFILIATES?.VIEW(
                    row?.original?.affiliate_id
                  )}
                  target="_blank"
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  {row?.original?.affiliate_details?.is_company
                    ? row?.original?.affiliate_details?.company_name
                    : `${row?.original?.affiliate_details?.first_name ?? ""} ${
                        row?.original?.affiliate_details?.last_name ?? ""
                      }`}
                </Link>
              </div>
            )}
          </div>
        </div>
      ),
    },

    {
      accessorKey: "body_type_id",
      header: "Body Type",
      cell: ({ row }) => row?.original?.body_type_details?.title || "",
    },

    {
      accessorKey: "expiry",
      header: "Expiry",
      cell: ({ row }) => {
        const expired = row?.original?.expired_documents || [];
        const closeToExpiry = row?.original?.close_to_expiry_documents || [];

        return (
          <>
            {expired.length > 0 &&
              expired.map((item, index) => (
                <Badge
                  key={`expired-${index}`}
                  variant="destructive"
                  className="m-1 flex"
                >
                  {item}
                </Badge>
              ))}

            {closeToExpiry.length > 0 &&
              closeToExpiry.map((item, index) => (
                <Badge
                  key={`close-${index}`}
                  className="bg-blue-500 text-white m-1 flex"
                >
                  {item}
                </Badge>
              ))}
          </>
        );
      },
    },

    {
      accessorKey: "rent_price",
      header: "Per Day Rent",
      cell: ({ row }) => {
        const price = row?.original?.rent_price;
        return price ? `AED ${price}` : "AED 0";
      },
    },

    {
      accessorKey: "transmission_type_id",
      header: "Transmission Type",
      cell: ({ row }) =>
        getKeyFromData(
          VEHICLES_TRANSMISSIONS,
          row?.original?.transmission_type_id
        ),
    },

    {
      accessorKey: "status_id",
      header: "Status",
      cell: ({ row }) =>
        getKeyFromData(VEHICLES_STATUS, row?.original?.status_id),
    },

    {
      accessorKey: "seats",
      header: "Seats",
      cell: ({ row }) => getKeyFromData(VEHICLES_SEATS, row?.original?.seats),
    },

    {
      accessorKey: "fuel_type_id",
      header: "Fuel Type",
      cell: ({ row }) =>
        getKeyFromData(VEHICLES_FUEL_TYPES, row?.original?.fuel_type_id),
    },

    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const vehicle = row?.original;
        return (
          <div className="flex gap-2">
            <VehiclesActionButtons vehicle={vehicle} />
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 pb-8">
      {/* --- Header --- */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-gray-900">Vehicle</h1>
        <div className="flex items-center gap-4">
          <div className="max-w-md space-y-4">
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

          {/* Collapse Button */}
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

      {/* --- Collapsible Section --- */}
      <div
        ref={contentRef}
        style={{
          maxHeight: height === "auto" ? "none" : `${height}px`,
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}
      >
        <div className="grid grid-cols-3 gap-4 py-1">
          <div className="col-span-2">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <WidgetSection data={statistics} loading={statisticsLoading} />
            </div>
          </div>
          <ChartsPieChart
            title="Vehicle Status"
            centerLabel="Vehicle Status"
            data={vehicleStatus}
            loading={vehicleStatusLoading}
          />
        </div>
      </div>

      {/* --- Actions --- */}
      <div className="flex items-center justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              {selectedView?.icon && <selectedView.icon className="w-4 h-4" />}
              {selectedView?.label}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40">
            <DropdownMenuRadioGroup
              value={viewMode}
              onValueChange={setViewMode}
            >
              {viewOptions.map((opt) => (
                <DropdownMenuRadioItem
                  key={opt.value}
                  value={opt.value}
                  className="flex items-center gap-2"
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          onClick={() =>
            showDrawer({
              title: "Add Vehicle",
              size: "xl",
              content: (
                <div className="py-4">
                  <VehiclesForm />
                </div>
              ),
            })
          }
        >
          Add Vehicle
        </Button>
      </div>

      {/* --- Filters --- */}
      <VehiclesFilters />

      {/* --- Vehicle Views --- */}
      <div className="space-y-4">
        {vehiclesLoading ? (
          <LoadingSkeletonTable />
        ) : (
          <>
            {viewMode === "table" && (
              <DataTable
                columns={columns({ page, itemsPerPage })}
                data={currentVehicles}
              />
            )}

            {viewMode === "list" &&
              (currentVehicles?.length > 0 ? (
                currentVehicles.map((vehicle, index) => (
                  <VehiclesListCard key={index} vehicle={vehicle} />
                ))
              ) : (
                <RecordNotFound simple={true} />
              ))}

            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentVehicles?.length > 0 ? (
                  currentVehicles.map((vehicle, index) => (
                    <VehiclesGridCard key={index} vehicle={vehicle} />
                  ))
                ) : (
                  <RecordNotFound simple={true} />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* --- Pagination --- */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
