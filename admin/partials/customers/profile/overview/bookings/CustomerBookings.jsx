"use client";
import React, { useState } from "react";

import { Star } from "lucide-react";

import { DataTable } from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Button from "@/components/Button";
import { Plus, Send, Undo2, Pen } from "lucide-react";
//import BookingAddEditForm from "@/partials/booking/BookingForms/BookingAddEditForm";
import { useDrawer } from "@/context/drawer-context";
import RecordNotFound from "@/components/RecordNotFound";
import BookingsForm from "@/partials/bookings/BookingForm/BookingsForm";

import useCustomersStore from "@/stores/customers/useCustomersStore";
import useCustomerBookingStore from "@/stores/customers/useCustomerBookingStore";

import { formatDate, getMocDataLabelByValue } from "@/helper/GeneralFunctions";
import useBookingsStore from "@/stores/rentify/useBookingsStore";
import {
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  SECURITY_DEPOSIT_STATUSES,
} from "@/constants/rentify_constants";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LuEllipsis } from "react-icons/lu";
import toast from "react-hot-toast";
import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { GET } from "@/helper/ServerSideActions";
import CashPaymentForm from "@/partials/bookings/PaymentForm/CashPaymentForm";
import CardPaymentForm from "@/partials/bookings/PaymentForm/CardPaymentForm";
import PaymentReturnForm from "@/partials/bookings/PaymentForm/PaymentReturnForm";

// ⭐ Favorite Handler
export const markAsFavorite = async (id, v) => {
  const { bookings, setBookings } = useBookingsStore.getState();

  try {
    const newFav = v === 1 ? 0 : 1;

    const response = await GET(
      rentify_endpoints?.rentify?.bookings?.favorite(id, newFav)
    );

    if (response?.status === 200) {
      toast.success("Updated favorite status.");
    } else {
      toast.error("Failed to update favorite status.");
    }
  } catch (error) {
    toast.error("Failed to update favorite.");
  }
};

const CustomerBookings = () => {
  const { showDrawer } = useDrawer();

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;
  const rpp = 5;

  const { customer } = useCustomersStore();
  const { page } = useBookingsStore.getState();
  const { setCustomerBookings } = useCustomerBookingStore();

  const totalPages = Math.ceil(customer?.bookings?.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = customer?.bookings?.slice(startIndex, endIndex);

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

  const columns = [
    {
      accessorKey: "serial",
      header: () => <div className="text-center">Sr. No.</div>,
      cell: ({ row }) => {
        const serial = (currentPage - 1) * rpp + (row.index + 1);
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
/*
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
*/
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

  return (
    <Card className="gap-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-900">Bookings</h2>
          <Button
            onClick={() =>
              showDrawer({
                title: "Add Booking",
                size: "xl",
                content: (
                  <div className="py-4">
                    <BookingsForm
                      record={{
                        is_company: customer?.is_company,
                        customer_id: customer?.id,
                      }}
                    />
                  </div>
                ),
              })
            }
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>

      {customer?.bookings?.length ? (
        <CardContent>
          {/* <Filters /> */}
          <DataTable columns={columns} data={currentBookings} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </CardContent>
      ) : (
        <RecordNotFound />
      )}
    </Card>
  );
};

export default CustomerBookings;
