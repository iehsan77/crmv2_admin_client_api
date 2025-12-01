"use client";
import { useRef, useState, useEffect, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Image from "next/image";
import Link from "next/link";

import { LuEllipsis } from "react-icons/lu";
import { ChevronDown, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDrawer } from "@/context/drawer-context";

import Tabs from "@/components/Tabs";
import Button from "@/components/Button";
import Pagination from "@/components/Pagination";
import { DataTable } from "@/components/DataTable";
import WidgetSection from "@/components/WidgetSection";
import ChartsPieChart from "@/components/ChartsPieChart";
import MetricsCardList from "@/components/MetricsCardList";
import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";
import DateRangePicker from "@/components/FormFields/DateRangePicker";

import { booking_columns } from "./booking_columns";
import BookingsFilters from "@/partials/bookings/BookingsFilters";
import BookingsForm from "@/partials/bookings/BookingForm/BookingsForm";
import CashPaymentForm from "@/partials/bookings/PaymentForm/CashPaymentForm";
import CardPaymentForm from "@/partials/bookings/PaymentForm/CardPaymentForm";
import PaymentReturnForm from "@/partials/bookings/PaymentForm/PaymentReturnForm";

//import { POST } from "@/helper/ServerSideActions";
//import { rentify_endpoints } from "@/utils/rentify_endpoints";
import useBookingsStore, {
  useBookingsFiltersStore,
  useBookingsStatisticsStore,
} from "@/stores/rentify/useBookingsStore";
import useCommonStore from "@/stores/useCommonStore";
import useSettingsStore from "@/stores/useSettingsStore";
import { formatDate, getMocDataLabelByValue } from "@/helper/GeneralFunctions";
import {
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  SECURITY_DEPOSIT_STATUSES,
} from "@/constants/rentify_constants";

const BookingListView = () => {
  //const currentDate = new Date();
  //const [range, setRange] = useState({ from: currentDate, to: currentDate });

  const { range, setRange } = useCommonStore();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [height, setHeight] = useState("auto");
  const [viewMode, setViewMode] = useState("list");

  const { showDrawer } = useDrawer();

  const {
    statistics,
    statisticsLoading,
    bookingsStatus,
    bookingsStatusLoading,
    fetchBookingsStatistics,
  } = useBookingsStatisticsStore();

  const { rpp } = useSettingsStore.getState();

  const page = useBookingsStore((s) => s.page);
  const setPage = useBookingsStore((s) => s.setPage);
  const bookings = useBookingsStore((s) => s.bookings);
  const fetchBookings = useBookingsStore((s) => s.fetchBookings);
  const bookingsLoading = useBookingsStore((s) => s.bookingsLoading);

  const { getPayload } = useBookingsFiltersStore();

  // 🔹 Load bookings initially
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    fetchBookingsStatistics(range);
  }, [fetchBookingsStatistics, range]);

  const contentRef = useRef(null);
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    if (isCollapsed) {
      setHeight(content.scrollHeight);
      requestAnimationFrame(() => setHeight(0));
    } else {
      const fullHeight = content.scrollHeight;
      setHeight(fullHeight);
      const timeout = setTimeout(() => setHeight("auto"), 300);
      return () => clearTimeout(timeout);
    }
  }, [isCollapsed]);

  const totalPages = bookings.length ? Math.ceil(bookings.length / rpp) : 1;
  const currentBookings = bookings.slice((page - 1) * rpp, page * rpp);
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setPage(page);
  };

  // 🔹 Actions menu (DRY)
  const getDrawerAction = (title, content) => () =>
    showDrawer({ title, size: "xl", content });

  const getActionItems = (row) => {
    const actions = [];

    const status = row?.booking_status_id;
    console.log(row)

    // status = 1 → Payment pending
    if (status === 1) {
      actions.push(
        {
          label: "POS Payment",
          content: () => <CashPaymentForm record={row} />,
        },
        /*
        {
          label: "Card Payment",
          content: () => <CardPaymentForm record={row} />,
        },
        */
        {
          label: "Edit Booking",
          content: () => <BookingsForm record={row} />,
        }
      );
    }
    // status = 2 → Vehicle delivery pending
    if (status === 2) {
      actions.push(
        {
          label: "Vehicle Delivery",
          content: () => <BookingsForm delivery record={row} />,
        },
        {
          label: "Refund Request",
          content: () => <PaymentReturnForm record={row} />,
        }
      );
    }
    // status = 3 → Vehicle return pending
    if (status === 3) {
      actions.push({
        label: "Vehicle Return",
        content: () => <BookingsForm returned record={row} />,
      });
    }
    // status = 4 → Completed but editable
    if (status === 4) {
      actions.push({
        label: "POS Payment",
        content: () => <CashPaymentForm record={row} />,
      });
    }

    // status = 5 → Refund request case
    if (status === 6) {
      actions.push({
        label: "POS Payment",
        content: () => <CashPaymentForm record={row} />,
      });
    }

    return actions;
  };

  /*
  const actionItems = [
    {
      label: "POS Payment",
      content: (row) => <CashPaymentForm record={row} />,
    },
    {
      label: "Card Payment",
      content: (row) => <CardPaymentForm record={row} />,
    },
    {
      label: "Vehicle Delivery",
      content: (row) => <BookingsForm delivery record={row} />,
    },
    {
      label: "Vehicle Return",
      content: (row) => <BookingsForm returned record={row} />,
    },
    { label: "Edit Booking", content: (row) => <BookingsForm record={row} /> },
    {
      label: "Refund Request",
      content: (row) => <PaymentReturnForm record={row} />,
    },
  ];

  const columns = useMemo(
    () => [
      ...booking_columns(),
      {
        header: "Actions",
        accessorKey: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shadow-none outline-none focus-visible:ring-0 border"
              >
                <LuEllipsis className="h-4 w-4" title="Action Menu" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom">
              {actionItems.map((action, idx) => (
                <DropdownMenuItem
                  key={idx}
                  onClick={getDrawerAction(
                    action.label,
                    action.content(row.original)
                  )}
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [showDrawer]
  );
*/
  // --- Columns ---
  const columns = [
    {
      accessorKey: "serial",
      header: () => <div className="text-center">Sr. No.</div>,
      cell: ({ row }) => {
        const serial = (page - 1) * rpp + (row.index + 1);
        return <span className="block text-center">{serial}</span>;
      },
    },
    {
      header: "Booking ID",
      accessorKey: "booking_uid",
    },
    {
      header: "Booking Date",
      accessorKey: "pickup_time",
      cell: ({ row }) => formatDate(row.original?.pickup_time),
    },
    {
      header: "Client Name",
      accessorKey: "customer_details.first_name",
      cell: ({ row }) => {
        const customer = row.original?.customer_details;
        const customerId = customer?.id;

        // If company
        if (customer?.is_company) {
          return (
            <Link
              href={ADMIN_PATHS?.RENTIFY?.BOOKINGS?.CUSTOMER?.VIEW(customerId)}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              {customer?.company_name?.trim() || "-"}
            </Link>
          );
        }

        // If individual
        const first = customer?.first_name?.trim() || "";
        const last = customer?.last_name?.trim() || "";
        const fullName = `${first} ${last}`.trim();

        return fullName ? (
          <Link
            href={ADMIN_PATHS?.RENTIFY?.BOOKINGS?.CUSTOMER?.VIEW(customerId)}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            {fullName}
          </Link>
        ) : (
          "-"
        );
      },
    },
    {
      header: "Vehicle",
      accessorKey: "vehicle_details.title",
      cell: ({ row }) => {
        const vehicle = row.original?.vehicle_details;
        const img = row.original?.vehicle_thumbnail?.[0]?.url;
        return (
          <Link href={ADMIN_PATHS?.RENTIFY?.VEHICLES?.VIEW(vehicle?.id)}>
            <div className="flex items-center gap-2">
              <Image
                src={img || "/images/carplaceholder.jpg"}
                alt={vehicle?.title || "Vehicle image"}
                width={32}
                height={32}
                className="rounded-full object-cover w-8 h-8"
              />
              <span className="text-sm font-medium truncate">
                {vehicle?.title || "-"}
              </span>
            </div>
          </Link>
        );
      },
    },
    {
      header: "Rental Period",
      accessorKey: "rental_period",
      cell: ({ row }) => (
        <span>
          {formatDate(row.original?.pickup_time)}{" "}
          <span className="font-bold">to</span>{" "}
          {formatDate(row.original?.return_time)}
        </span>
      ),
    },
    {
      header: "Rent Per Day",
      accessorKey: "rent_price",
      cell: ({ row }) => `AED ${row.original?.rent_price ?? "-"}`,
    },
    /*
    {
      header: "Plan",
      accessorKey: "plan",
      cell: () => "-",
    },
    */
    {
      header: "Total Payment",
      accessorKey: "total_rent_amount",
      cell: ({ row }) => `AED ${row.original?.total_rent_amount}`,
    },
    {
      header: "Rental Fee",
      accessorKey: "payment_status_id",
      cell: ({ row }) =>
        getMocDataLabelByValue(
          PAYMENT_STATUSES,
          row?.original?.payment_status_id
        ) || "-",
    },
    {
      header: "Security",
      accessorKey: "security_deposit",
      cell: ({ row }) => `AED ${row.original?.security_deposit ?? "-"}`,
    },
    {
      header: "Security Deposit",
      accessorKey: "security_deposit_status_id",
      cell: ({ row }) =>
        getMocDataLabelByValue(
          SECURITY_DEPOSIT_STATUSES,
          row?.original?.security_deposit_status_id
        ) || "-",
    },
    {
      header: "Booking Status",
      accessorKey: "booking_status_id",
      cell: ({ row }) =>
        getMocDataLabelByValue(
          BOOKING_STATUSES,
          row?.original?.booking_status_id
        ) || "-",
    },
    {
      header: "Favorite",
      accessorKey: "favorite",
      cell: ({ row }) => (
        <div className="flex justify-center items-center gap-2">
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
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shadow-none outline-none focus-visible:ring-0 border"
            >
              <LuEllipsis className="h-4 w-4" title="Action Menu" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom">
            {getActionItems(row.original).map((action, idx) => (
              <DropdownMenuItem
                key={idx}
                onClick={getDrawerAction(
                  action.label,
                  action.content(row.original)
                )}
              >
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },

    /*
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shadow-none outline-none focus-visible:ring-0 border"
            >
              <LuEllipsis className="h-4 w-4" title="Action Menu" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom">
            {actionItems.map((action, idx) => (
              <DropdownMenuItem
                key={idx}
                onClick={getDrawerAction(
                  action.label,
                  action.content(row.original)
                )}
              >
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
*/
  ];

  const navTabs = [
    {
      name: "Dashboard View",
      value: "dashboard",
      content: (
        <div className="grid grid-cols-3 gap-4 py-1">
          <div className="col-span-2">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <WidgetSection
                data={statistics.dashboard_view}
                loading={statisticsLoading}
              />
            </div>
          </div>
          <ChartsPieChart
            title="Booking Status"
            centerLabel="Booking Status"
            data={bookingsStatus}
            loading={bookingsStatusLoading}
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
        <h1 className="text-3xl font-semibold text-gray-900">
          Vehicle Booking
        </h1>
        <div className="flex items-center gap-4">
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
          <Button
            variant="outline"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="border-0 shadow-none hover:bg-transparent flex items-center gap-2"
          >
            {isCollapsed ? "Expand" : "Collapse"}
            <div className="p-1 border rounded-full shadow-md">
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

      {/* Dashboard Tabs */}
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

      {/* Add Booking */}
      <div className="flex items-center justify-end gap-2">
        <Button onClick={getDrawerAction("Add Booking", <BookingsForm />)}>
          Add Booking
        </Button>
      </div>

      <BookingsFilters />

      {bookingsLoading ? (
        <LoadingSkeletonTable />
      ) : (
        <DataTable columns={columns} data={currentBookings} />
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default BookingListView;
