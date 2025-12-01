import Image from "next/image";
import Link from "next/link";

import { formatDate, getMocDataLabelByValue } from "@/helper/GeneralFunctions";
import {
  PAYMENT_STATUSES,
  SECURITY_DEPOSIT_STATUSES,
  BOOKING_STATUSES,
} from "@/constants/rentify_constants";

export default function Columns({ currentPage, itemsPerPage }) {
  const renderText = (value) => {
    if (!value) return "-";
    const str = String(value);
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return [
    {
      id: "serial",
      accessorKey: "id",
      header: () => <div className="text-center">#</div>,
      cell: ({ row }) => {
        const serial = (currentPage - 1) * itemsPerPage + (row.index + 1);
        return <span className="block text-center">{serial}</span>;
      },
    },
    {
      header: "Booking ID",
      accessorKey: "booking_uid",
      cell: ({ row }) => (
        <span className="text-blue-600 hover:underline cursor-pointer">
          {row.original?.booking_uid}
        </span>
      ),
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
        if (row.original?.customer_details?.is_company) {
          return (
            <span>
              {row.original?.customer_details?.company_name?.trim() || "- c"}
            </span>
          );
        }

        const { first_name = "", last_name = "" } =
          row.original?.customer_details || {};
        const fullName = `${first_name} ${last_name}`.trim();

        return <span>{fullName || "-"}</span>;
      },
    },
    {
      header: "Vehicle",
      accessorKey: "vehicle_details.title",
      cell: ({ row }) => {
        const vehicle = row.original?.vehicle_details;
        const img = row.original?.vehicle_thumbnail;
        return (
          <Link href={ADMIN_PATHS?.RENTIFY?.VEHICLES?.VIEW(vehicle?.id)}>
            <div className="flex items-center gap-2">
              <Image
                src={
                  img?.length > 0 ? img[0]?.url : "/images/carplaceholder.jpg" // ✅ Safe fallback
                }
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
      cell: ({ row }) => {
        const pickup_time = row.original?.pickup_time;
        const return_time = row.original?.return_time;

        return (
          <span>
            {formatDate(pickup_time, "MM dd, yyyy")}{" "}
            <span className="font-bold">to</span>{" "}
            {formatDate(return_time, "MM dd, yyyy")}
          </span>
        );
      },
    },
    {
      header: "Rent Per Day",
      accessorKey: "rent_price",
      cell: ({ row }) => {
        return `AED ${row.original?.rent_price ?? "-"}`;
      },
    },
    {
      header: "Plan",
      accessorKey: "plan",
      cell: ({ row }) => {
        return "-";
      },
    },
    {
      header: "Total Payment",
      accessorKey: "total_rent_amount",
      cell: ({ row }) => {
        return "AED " + row.original?.total_rent_amount;
      },
    },
    {
      header: "Rental Fee",
      accessorKey: "rent_price_status_id",
      cell: ({ row }) => {
        return (
          getMocDataLabelByValue(
            PAYMENT_STATUSES,
            row?.original?.payment_status_id
          ) || "-"
        );
      },
    },
    {
      header: "Security",
      accessorKey: "security",
      cell: ({ row }) => {
        return `AED ${row.original?.security_deposit ?? "-"}`;
      },
    },
    {
      header: "Security Deposit",
      accessorKey: "security_deposit_status_id",
      cell: ({ row }) => {
        return (
          getMocDataLabelByValue(
            SECURITY_DEPOSIT_STATUSES,
            row?.original?.security_deposit_status_id
          ) || "-"
        );
      },
    },
    {
      header: "Booking Status",
      accessorKey: "booking_status_id",
      cell: ({ row }) => {
        return (
          getMocDataLabelByValue(
            BOOKING_STATUSES,
            row?.original?.booking_status_id
          ) || "-"
        );
      },
    },
  ];
}
