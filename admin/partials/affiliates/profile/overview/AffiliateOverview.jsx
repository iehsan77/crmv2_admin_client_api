"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import Button from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import Pagination from "@/components/Pagination";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import DataHighlights from "@/partials/affiliates/profile/overview/DataHighlights";
import Filters from "@/partials/affiliates/profile/overview/Filters";

import ChartsBarChart from "@/components/ChartsBarChart";

import { useDrawer } from "@/context/drawer-context";

import useAffiliateStore from "@/stores/rentify/affiliates/useAffiliateStore";

import CashPaymentForm from "@/partials/bookings/PaymentForm/CashPaymentForm";
import CardPaymentForm from "@/partials/bookings/PaymentForm/CardPaymentForm";
import BookingsForm from "@/partials/bookings/BookingForm/BookingsForm";
import PaymentReturnForm from "@/partials/bookings/PaymentForm/PaymentReturnForm";

import { booking_columns } from "./booking_columns";
import { LuEllipsis } from "react-icons/lu";

import useBookingsStore from "@/stores/rentify/useBookingsStore";
import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";

const AffiliateOverview = ({ affiliate = [] }) => {
  const { id } = useParams();

  //const [currentPage, setCurrentPage] = useState(1);

  const [chartDataLoading, setChartDataLoading] = useState(true);
  const { showDrawer } = useDrawer();
  const itemsPerPage = 5;

  const {
    bookingHistoryLoading,
    bookingHistory,
    fetchBookingHistory,
    page,
    setPage,
  } = useAffiliateStore();

  const totalPages = bookingHistory.length
    ? Math.ceil(bookingHistory.length / itemsPerPage)
    : 0;
  const currentBookings = bookingHistory.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setPage(page);
    }
  };

  const getDrawerAction = (title, content) => () =>
    showDrawer({ title, size: "xl", content });
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
      content: (row) => <BookingsForm affiliateId={id} delivery record={row} />,
    },
    {
      label: "Vehicle Return",
      content: (row) => <BookingsForm affiliateId={id} returned record={row} />,
    },
    {
      label: "Edit Booking",
      content: (row) => <BookingsForm affiliateId={id} record={row} />,
    },
    {
      label: "Refund Request",
      content: (row) => <PaymentReturnForm record={row} />,
    },
  ];

  const columns = [
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
  ];

  useEffect(() => {
    if (affiliate) {
      setChartDataLoading(false);
    }
  }, [affiliate]);
  useEffect(() => {
    const body = {
      affiliate_id: id,
      view: "all_bookings",
      booking_uid: "",
      pickup_time: "",
      booking_status_id: "",
      customer_id: "",
      payment_status_id: "",
      rent_price: "",
      rental_period: "",
      security_deposit: "",
      //security_payment: filterFormValues?.security_payment ?? "",
      vehicle_id: "",

      /*
      booking_id: "",
      booking_date: "",
      client_id: "",
      vehicle_id: "",
      rental_period: "",
      rent_per_day: "",
      payment_status_id: "",
      security_deposit: "",
      security_payment: "",
      booking_status_id: "",
      */
    };

    fetchBookingHistory(body);
  }, [id, fetchBookingHistory]);

  console.log("bookingHistory 150");
  console.log(bookingHistory);

  return (
    <>
      <div className="space-y-4">
        <DataHighlights highlights={affiliate?.highlights} />
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-medium text-gray-900">Booking History</h1>
          <div className="space-x-2">
            {/* <Button>More Action</Button>
            <Button>Accept Return</Button> */}
            <Button
              onClick={getDrawerAction(
                "Add Booking",
                <BookingsForm affiliateId={id} />
              )}
            >
              Add Booking
            </Button>
          </div>
        </div>
        <Filters />
        {bookingHistoryLoading ? (
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
      <div className="pt-6">
        <ChartsBarChart
          data={affiliate?.activity_chart_data}
          loading={chartDataLoading}
        />
      </div>
    </>
  );
};

export default AffiliateOverview;
