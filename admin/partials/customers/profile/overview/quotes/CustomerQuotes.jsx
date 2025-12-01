"use client";
import { useEffect, useState } from "react";
import Filters from "./Filters";
import { DataTable } from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Button from "@/components/Button";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import RecordNotFound from "@/components/RecordNotFound";

const CustomerQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch Quotes (Dummy API handling)

  const totalPages = Math.ceil(quotes.length / itemsPerPage);
  const currentQuotes = quotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Table Columns
  const columns = [
    { accessorKey: "serialNo", header: "Serial No.", size: 80 },
    {
      accessorKey: "quoteNo",
      header: "Quote No",
      size: 120,
      cell: ({ row }) => (
        <span className="text-[#1E3A8A] hover:underline cursor-pointer whitespace-nowrap">
          {row.original.quoteNo}
        </span>
      ),
    },
    { accessorKey: "customerName", header: "Customer Name", size: 150 },
    { accessorKey: "quoteOwner", header: "Quote Owner", size: 140 },
    { accessorKey: "quoteDate", header: "Quote Date", size: 120 },
    { accessorKey: "item", header: "Item", size: 150 },
    { accessorKey: "agentBroker", header: "Agent/Broker", size: 140 },
    {
      accessorKey: "status",
      header: "Status",
      size: 100,
      cell: ({ row }) => {
        const status = row.original.status;
        const statusColors = {
          Approved: "bg-green-100 text-green-800",
          Pending: "bg-yellow-100 text-yellow-800",
          Rejected: "bg-red-100 text-red-800",
          Draft: "bg-gray-100 text-gray-800",
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      size: 100,
      cell: ({ row }) => (
        <span className="font-semibold text-green-600">
          {row.original.amount}
        </span>
      ),
    },
    {
      accessorKey: "actions",
      header: "Actions",
      size: 180,
      cell: () => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card className="gap-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-900">Quotes</h2>
          {/* <Button>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button> */}
        </div>
      </CardHeader>
      <CardContent>
        {currentQuotes?.length ? (
            <DataTable
              columns={columns}
              data={currentQuotes}
              useStore={useContactsStore}
            />
        ) : (
          <RecordNotFound />
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerQuotes;
