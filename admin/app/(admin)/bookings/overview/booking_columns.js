import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import toast from "react-hot-toast";

import { formatDate, getMocDataLabelByValue } from "@/helper/GeneralFunctions";
import {
  PAYMENT_STATUSES,
  SECURITY_DEPOSIT_STATUSES,
  BOOKING_STATUSES,
} from "@/constants/rentify_constants";
import { Button } from "@/components/ui/button";
import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { GET } from "@/helper/ServerSideActions";
import useBookingsStore from "@/stores/rentify/useBookingsStore";
import useSettingsStore from "@/stores/useSettingsStore";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LuEllipsis } from "react-icons/lu";

// ⭐ Favorite Handler
export const markAsFavorite = async (id, v) => {
  const { bookings, setBookings } = useBookingsStore.getState();

  try {
    const newFav = v === 1 ? 0 : 1;

    const response = await GET(
      rentify_endpoints?.rentify?.bookings?.favorite(id, newFav)
    );

    if (response?.status === 200) {
      const updated = bookings.map((item) =>
        item.id === id ? { ...item, favorite: newFav } : item
      );
      setBookings(updated);
      toast.success("Updated favorite status.");
    } else {
      toast.error("Failed to update favorite status.");
    }
  } catch (error) {
    console.log(error);
    toast.error("Failed to update favorite.");
  }
};

export const booking_columns = () => {
  const { rpp } = useSettingsStore.getState();
  const { page } = useBookingsStore.getState();

  console.log(page);

  return [
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
      cell: ({ row }) => {
        const bookingId = row.original?.booking_uid;
        const customerId = row.original?.customer_details?.id;
        return { bookingId };
      },
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
};
